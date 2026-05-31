const mongoose = require('mongoose');

const shopkeeperSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  address: { type: String, trim: true },
  totalOutstanding: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  deletedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Shopkeeper', shopkeeperSchema);
