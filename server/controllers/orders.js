const { validationResult } = require('express-validator');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Shopkeeper = require('../models/Shopkeeper');
const Payment = require('../models/Payment');

exports.getAll = async (req, res) => {
  try {
    const { date, shopkeeperId, startDate, endDate } = req.query;
    let filter = {};

    if (shopkeeperId) filter.shopkeeperId = shopkeeperId;

    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      filter.date = { $gte: start, $lte: end };
    } else if (startDate || endDate) {
      const dateFilter = {};
      if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
        dateFilter.$gte = start;
      }
      if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
        dateFilter.$lte = end;
      }
      filter.date = dateFilter;
    }

    const orders = await Order.find(filter)
      .populate('shopkeeperId', 'name phone')
      .sort({ date: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.create = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const session = await Order.startSession();
  try {
    const { shopkeeperId, items, discount = 0, amountPaid = 0 } = req.body;
    const discountAmount = Number(discount) || 0;
    const paidNow = Number(amountPaid) || 0;

    if (discountAmount < 0) return res.status(400).json({ message: 'Discount cannot be negative' });
    if (paidNow < 0) return res.status(400).json({ message: 'Amount paid cannot be negative' });

    await session.startTransaction();

    const shopkeeper = await Shopkeeper.findOne({ _id: shopkeeperId, isActive: { $ne: false } }).session(session);
    if (!shopkeeper) return res.status(404).json({ message: 'Shopkeeper not found' });

    const quantitiesByProduct = new Map();
    for (const item of items) {
      const productId = String(item.productId);
      quantitiesByProduct.set(productId, (quantitiesByProduct.get(productId) || 0) + Number(item.quantity));
    }

    const products = await Product.find({
      _id: { $in: [...quantitiesByProduct.keys()] },
      isActive: { $ne: false },
    }).session(session);
    const productsById = new Map(products.map((product) => [String(product._id), product]));

    let subtotal = 0;
    const orderItems = [];

    for (const [productId, quantity] of quantitiesByProduct) {
      const product = productsById.get(productId);
      if (!product) return res.status(404).json({ message: `Product ${productId} not found` });
      if (product.stock < quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${product.name}. Available: ${product.stock}` });
      }

      const itemSubtotal = product.price * quantity;
      subtotal += itemSubtotal;

      orderItems.push({
        productId: product._id,
        productName: product.name,
        quantity,
        unitPrice: product.price,
        subtotal: itemSubtotal,
      });
    }

    if (discountAmount > subtotal) return res.status(400).json({ message: 'Discount cannot exceed subtotal' });

    const total = subtotal - discountAmount;
    if (paidNow > total) return res.status(400).json({ message: 'Amount paid cannot exceed order total' });

    for (const [productId, quantity] of quantitiesByProduct) {
      const result = await Product.updateOne(
        { _id: productId, stock: { $gte: quantity } },
        { $inc: { stock: -quantity } },
        { session }
      );
      if (result.modifiedCount !== 1) {
        throw new Error('Stock changed while creating the order. Please retry.');
      }
    }

    const outstanding = total - paidNow;

    let paymentStatus = 'Unpaid';
    if (paidNow >= total) paymentStatus = 'Paid';
    else if (paidNow > 0) paymentStatus = 'Partial';

    const order = new Order({
      shopkeeperId,
      items: orderItems,
      subtotal,
      discount: discountAmount,
      total,
      amountPaid: paidNow,
      outstanding,
      paymentStatus,
    });

    await order.save({ session });

    shopkeeper.totalOutstanding += outstanding;
    await shopkeeper.save({ session });

    await session.commitTransaction();

    const populated = await Order.findById(order._id).populate('shopkeeperId', 'name phone address');
    res.status(201).json(populated);
  } catch (err) {
    if (session.inTransaction()) await session.abortTransaction();
    res.status(500).json({ message: 'Server error', error: err.message });
  } finally {
    if (session.inTransaction()) await session.abortTransaction();
    session.endSession();
  }
};

exports.getOne = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('shopkeeperId', 'name phone address');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.update = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const session = await Order.startSession();
  try {
    const { shopkeeperId, items, discount = 0, amountPaid = 0 } = req.body;
    const discountAmount = Number(discount) || 0;
    const paidNow = Number(amountPaid) || 0;

    if (discountAmount < 0) return res.status(400).json({ message: 'Discount cannot be negative' });
    if (paidNow < 0) return res.status(400).json({ message: 'Amount paid cannot be negative' });

    await session.startTransaction();

    const order = await Order.findById(req.params.id).session(session);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const recordedPayments = await Payment.countDocuments({ orderId: order._id }).session(session);
    if (recordedPayments > 0) {
      return res.status(400).json({
        message: 'This order has recorded payments. Reverse or adjust payments before editing the order.',
      });
    }

    const newShopkeeper = await Shopkeeper.findOne({ _id: shopkeeperId, isActive: { $ne: false } }).session(session);
    if (!newShopkeeper) return res.status(404).json({ message: 'Shopkeeper not found' });

    for (const item of order.items) {
      await Product.updateOne(
        { _id: item.productId },
        { $inc: { stock: item.quantity } },
        { session }
      );
    }

    const quantitiesByProduct = new Map();
    for (const item of items) {
      const productId = String(item.productId);
      quantitiesByProduct.set(productId, (quantitiesByProduct.get(productId) || 0) + Number(item.quantity));
    }

    const products = await Product.find({
      _id: { $in: [...quantitiesByProduct.keys()] },
      isActive: { $ne: false },
    }).session(session);
    const productsById = new Map(products.map((product) => [String(product._id), product]));

    let subtotal = 0;
    const orderItems = [];

    for (const [productId, quantity] of quantitiesByProduct) {
      const product = productsById.get(productId);
      if (!product) return res.status(404).json({ message: `Product ${productId} not found` });

      const itemSubtotal = product.price * quantity;
      subtotal += itemSubtotal;

      orderItems.push({
        productId: product._id,
        productName: product.name,
        quantity,
        unitPrice: product.price,
        subtotal: itemSubtotal,
      });
    }

    if (discountAmount > subtotal) return res.status(400).json({ message: 'Discount cannot exceed subtotal' });

    const total = subtotal - discountAmount;
    if (paidNow > total) return res.status(400).json({ message: 'Amount paid cannot exceed order total' });

    for (const [productId, quantity] of quantitiesByProduct) {
      const result = await Product.updateOne(
        { _id: productId, stock: { $gte: quantity } },
        { $inc: { stock: -quantity } },
        { session }
      );
      if (result.modifiedCount !== 1) {
        throw new Error('Insufficient stock after restoring the previous order quantities. Please retry.');
      }
    }

    const outstanding = total - paidNow;
    let paymentStatus = 'Unpaid';
    if (paidNow >= total) paymentStatus = 'Paid';
    else if (paidNow > 0) paymentStatus = 'Partial';

    if (String(order.shopkeeperId) === String(newShopkeeper._id)) {
      newShopkeeper.totalOutstanding = Math.max(
        0,
        newShopkeeper.totalOutstanding - order.outstanding + outstanding
      );
      await newShopkeeper.save({ session });
    } else {
      await Shopkeeper.updateOne(
        { _id: order.shopkeeperId },
        { $inc: { totalOutstanding: -order.outstanding } },
        { session }
      );
      newShopkeeper.totalOutstanding += outstanding;
      await newShopkeeper.save({ session });
    }

    order.shopkeeperId = shopkeeperId;
    order.items = orderItems;
    order.subtotal = subtotal;
    order.discount = discountAmount;
    order.total = total;
    order.amountPaid = paidNow;
    order.outstanding = outstanding;
    order.paymentStatus = paymentStatus;

    await order.save({ session });
    await session.commitTransaction();

    const populated = await Order.findById(order._id).populate('shopkeeperId', 'name phone address');
    res.json(populated);
  } catch (err) {
    if (session.inTransaction()) await session.abortTransaction();
    res.status(500).json({ message: 'Server error', error: err.message });
  } finally {
    if (session.inTransaction()) await session.abortTransaction();
    session.endSession();
  }
};
