const mongoose = require('mongoose');
const Counter = require('./Counter');

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  subtotal: { type: Number, required: true },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  billNo: { type: String, unique: true },
  shopkeeperId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shopkeeper', required: true },
  items: [orderItemSchema],
  subtotal: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  total: { type: Number, required: true },
  paymentStatus: {
    type: String,
    enum: ['Unpaid', 'Partial', 'Paid'],
    default: 'Unpaid',
  },
  amountPaid: { type: Number, default: 0 },
  outstanding: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

// Auto-generate billNo before saving
orderSchema.pre('save', async function (next) {
  if (!this.billNo) {
    const year = new Date().getFullYear();
    const counter = await Counter.findOneAndUpdate(
      { name: `invoice_${year}` },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    const seq = String(counter.seq).padStart(4, '0');
    this.billNo = `INV-${year}-${seq}`;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
