const { validationResult } = require('express-validator');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Shopkeeper = require('../models/Shopkeeper');

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
    } else if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.date = { $gte: start, $lte: end };
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

  try {
    const { shopkeeperId, items, discount = 0, amountPaid = 0 } = req.body;

    const shopkeeper = await Shopkeeper.findById(shopkeeperId);
    if (!shopkeeper) return res.status(404).json({ message: 'Shopkeeper not found' });

    // Build order items and decrement stock
    const orderItems = [];
    let subtotal = 0;

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) return res.status(404).json({ message: `Product ${item.productId} not found` });
      if (product.stock < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${product.name}. Available: ${product.stock}` });
      }

      const itemSubtotal = product.price * item.quantity;
      subtotal += itemSubtotal;

      orderItems.push({
        productId: product._id,
        productName: product.name,
        quantity: item.quantity,
        unitPrice: product.price,
        subtotal: itemSubtotal,
      });

      // Decrement stock
      product.stock -= item.quantity;
      await product.save();
    }

    const total = subtotal - (discount || 0);
    const outstanding = total - (amountPaid || 0);

    let paymentStatus = 'Unpaid';
    if (amountPaid >= total) paymentStatus = 'Paid';
    else if (amountPaid > 0) paymentStatus = 'Partial';

    const order = new Order({
      shopkeeperId,
      items: orderItems,
      subtotal,
      discount: discount || 0,
      total,
      amountPaid: amountPaid || 0,
      outstanding: outstanding < 0 ? 0 : outstanding,
      paymentStatus,
    });

    await order.save();

    // Update shopkeeper's total outstanding
    shopkeeper.totalOutstanding += outstanding < 0 ? 0 : outstanding;
    await shopkeeper.save();

    const populated = await Order.findById(order._id).populate('shopkeeperId', 'name phone address');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
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
