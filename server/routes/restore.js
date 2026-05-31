const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const Shopkeeper = require('../models/Shopkeeper');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Counter = require('../models/Counter');
const verifyToken = require('../middleware/auth');

router.use(verifyToken);

const rebuildCountersFromOrders = async (session) => {
  const orders = await Order.find({}, 'billNo').lean().session(session);
  const maxByYear = new Map();

  for (const order of orders) {
    const match = /^INV-(\d{4})-(\d+)$/.exec(order.billNo || '');
    if (!match) continue;

    const [, year, seq] = match;
    maxByYear.set(year, Math.max(maxByYear.get(year) || 0, Number(seq)));
  }

  if (maxByYear.size === 0) return;

  await Counter.insertMany(
    [...maxByYear].map(([year, seq]) => ({ name: `invoice_${year}`, seq })),
    { session }
  );
};

// POST /api/restore
// Expects JSON body: { shopkeepers: [], products: [], orders: [], payments: [], counters?: [] }
router.post('/', async (req, res) => {
  const { shopkeepers, products, orders, payments, counters } = req.body || {};

  if (![shopkeepers, products, orders, payments].every(Array.isArray) || (counters && !Array.isArray(counters))) {
    return res.status(400).json({ message: 'Invalid backup format. Expected shopkeepers, products, orders, payments.' });
  }

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await Promise.all([
        Shopkeeper.deleteMany({}, { session }),
        Product.deleteMany({}, { session }),
        Order.deleteMany({}, { session }),
        Payment.deleteMany({}, { session }),
        Counter.deleteMany({}, { session }),
      ]);

      if (shopkeepers.length) await Shopkeeper.insertMany(shopkeepers, { session });
      if (products.length) await Product.insertMany(products, { session });
      if (orders.length) await Order.insertMany(orders, { session });
      if (payments.length) await Payment.insertMany(payments, { session });

      if (counters?.length) {
        await Counter.insertMany(counters, { session });
      } else {
        await rebuildCountersFromOrders(session);
      }
    });

    res.json({ message: 'Restore completed' });
  } catch (err) {
    console.error('Restore error:', err);
    res.status(500).json({ message: 'Failed to restore backup', error: err.message });
  } finally {
    session.endSession();
  }
});

module.exports = router;
