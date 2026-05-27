const { validationResult } = require('express-validator');
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const Shopkeeper = require('../models/Shopkeeper');

exports.create = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { orderId, shopkeeperId, amountPaid, note } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.paymentStatus === 'Paid') {
      return res.status(400).json({ message: 'This order is already fully paid' });
    }

    const shopkeeper = await Shopkeeper.findById(shopkeeperId);
    if (!shopkeeper) return res.status(404).json({ message: 'Shopkeeper not found' });

    const payment = await Payment.create({ orderId, shopkeeperId, amountPaid, note });

    // Update order
    const newAmountPaid = order.amountPaid + amountPaid;
    const newOutstanding = order.total - newAmountPaid;

    order.amountPaid = newAmountPaid;
    order.outstanding = newOutstanding < 0 ? 0 : newOutstanding;

    if (newAmountPaid >= order.total) order.paymentStatus = 'Paid';
    else if (newAmountPaid > 0) order.paymentStatus = 'Partial';

    await order.save();

    // Update shopkeeper outstanding
    const reduction = amountPaid > order.outstanding + amountPaid ? order.outstanding : amountPaid;
    shopkeeper.totalOutstanding = Math.max(0, shopkeeper.totalOutstanding - amountPaid);
    await shopkeeper.save();

    res.status(201).json({ payment, order });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
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

