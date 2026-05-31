const { validationResult } = require('express-validator');
const Shopkeeper = require('../models/Shopkeeper');
const Order = require('../models/Order');
const Payment = require('../models/Payment');

exports.getAll = async (req, res) => {
  try {
    const { search } = req.query;
    const filter = { isActive: { $ne: false } };
    if (search) {
      filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
        ];
    }
    const shopkeepers = await Shopkeeper.find(filter).sort({ createdAt: -1 });
    res.json(shopkeepers);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.create = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const { name, phone, address } = req.body;
    const shopkeeper = await Shopkeeper.create({ name, phone, address });
    res.status(201).json(shopkeeper);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.update = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const { name, phone, address } = req.body;
    const shopkeeper = await Shopkeeper.findOneAndUpdate(
      { _id: req.params.id, isActive: { $ne: false } },
      { name, phone, address },
      { new: true, runValidators: true }
    );
    if (!shopkeeper) return res.status(404).json({ message: 'Shopkeeper not found' });
    res.json(shopkeeper);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const existing = await Shopkeeper.findOne({ _id: req.params.id, isActive: { $ne: false } });
    if (!existing) return res.status(404).json({ message: 'Shopkeeper not found' });
    if (existing.totalOutstanding > 0) {
      return res.status(400).json({ message: 'Cannot archive a shopkeeper with outstanding balance' });
    }

    const shopkeeper = await Shopkeeper.findOneAndUpdate(
      { _id: req.params.id, isActive: { $ne: false } },
      { isActive: false, deletedAt: new Date() },
      { new: true }
    );
    res.json({ message: 'Shopkeeper archived successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const shopkeeper = await Shopkeeper.findById(id);
    if (!shopkeeper) return res.status(404).json({ message: 'Shopkeeper not found' });

    const orders = await Order.find({ shopkeeperId: id }).sort({ date: -1 });
    const payments = await Payment.find({ shopkeeperId: id }).sort({ date: -1 });

    res.json({ shopkeeper, orders, payments });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
