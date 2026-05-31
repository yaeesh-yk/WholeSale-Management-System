const { validationResult } = require('express-validator');
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const Shopkeeper = require('../models/Shopkeeper');

exports.create = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const session = await Payment.startSession();
  try {
    const { orderId, shopkeeperId, amountPaid, note } = req.body;
    const paidNow = Number(amountPaid);

    await session.startTransaction();

    const order = await Order.findById(orderId).session(session);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.paymentStatus === 'Paid') {
      return res.status(400).json({ message: 'This order is already fully paid' });
    }
    if (String(order.shopkeeperId) !== String(shopkeeperId)) {
      return res.status(400).json({ message: 'Payment shopkeeper does not match the order shopkeeper' });
    }
    if (paidNow > order.outstanding) {
      return res.status(400).json({ message: `Payment cannot exceed outstanding amount (${order.outstanding})` });
    }

    const shopkeeper = await Shopkeeper.findById(order.shopkeeperId).session(session);
    if (!shopkeeper) return res.status(404).json({ message: 'Shopkeeper not found' });

    const [payment] = await Payment.create([{ orderId, shopkeeperId: order.shopkeeperId, amountPaid: paidNow, note }], { session });

    // Update order
    const newAmountPaid = order.amountPaid + paidNow;
    const newOutstanding = order.total - newAmountPaid;

    order.amountPaid = newAmountPaid;
    order.outstanding = newOutstanding < 0 ? 0 : newOutstanding;

    if (newAmountPaid >= order.total) order.paymentStatus = 'Paid';
    else if (newAmountPaid > 0) order.paymentStatus = 'Partial';

    await order.save({ session });

    // Update shopkeeper outstanding
    shopkeeper.totalOutstanding = Math.max(0, shopkeeper.totalOutstanding - paidNow);
    await shopkeeper.save({ session });

    await session.commitTransaction();

    res.status(201).json({ payment, order });
  } catch (err) {
    if (session.inTransaction()) await session.abortTransaction();
    res.status(500).json({ message: 'Server error', error: err.message });
  } finally {
    if (session.inTransaction()) await session.abortTransaction();
    session.endSession();
  }
};

exports.getByShopkeeper = async (req, res) => {
  try {
    const payments = await Payment.find({ shopkeeperId: req.params.shopkeeperId })
      .populate('orderId', 'billNo total date')
      .sort({ date: -1 });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getAll = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate('shopkeeperId', 'name phone')
      .populate('orderId', 'billNo total date')
      .sort({ date: -1 });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
