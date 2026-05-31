const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  category: { type: String, trim: true, default: 'General' },
  price: { type: Number, required: true, min: 0 },
  stock: { type: Number, required: true, min: 0, default: 0 },
  lowStockThreshold: { type: Number, default: 10 },
  isActive: { type: Boolean, default: true },
  deletedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Product', productSchema);
