const { validationResult } = require('express-validator');
const Product = require('../models/Product');

exports.getAll = async (req, res) => {
  try {
    const { search, lowStock } = req.query;
    let filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
      ];
    }
    let query = Product.find(filter).sort({ createdAt: -1 });
    const products = await query;
    if (lowStock === 'true') {
      return res.json(products.filter(p => p.stock <= p.lowStockThreshold));
    }
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.create = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const { name, category, price, stock, lowStockThreshold } = req.body;
    const product = await Product.create({ name, category, price, stock, lowStockThreshold });
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.update = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const { name, category, price, stock, lowStockThreshold } = req.body;
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { name, category, price, stock, lowStockThreshold },
      { new: true, runValidators: true }
    );
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
