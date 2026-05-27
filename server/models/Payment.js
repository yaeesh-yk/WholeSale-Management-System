const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  shopkeeperId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shopkeeper', required: true },
  amountPaid: { type: Number, required: true, min: 0.01 },
  note: { type: String, trim: true, default: '' },
  date: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Payment', paymentSchema);
