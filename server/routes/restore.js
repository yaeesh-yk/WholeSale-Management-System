const express = require('express');
const router = express.Router();

const Shopkeeper = require('../models/Shopkeeper');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Payment = require('../models/Payment');

// POST /api/restore
// Expects JSON body: { shopkeepers: [], products: [], orders: [], payments: [] }
router.post('/', async (req, res) => {
  const { shopkeepers, products, orders, payments } = req.body || {};

  if (!shopkeepers || !products || !orders || !payments) {
    return res.status(400).json({ message: 'Invalid backup format. Expected shopkeepers, products, orders, payments.' });
  }

  try {
    // Clear existing collections
    await Promise.all([
      Shopkeeper.deleteMany({}),
      Product.deleteMany({}),
      Order.deleteMany({}),
      Payment.deleteMany({}),
    ]);

    // Insert new documents (preserve provided _id if present)
    await Promise.all([
      Shopkeeper.insertMany(shopkeepers, { ordered: false }),
      Product.insertMany(products, { ordered: false }),
      Order.insertMany(orders, { ordered: false }),
      Payment.insertMany(payments, { ordered: false }),
    ]);

    res.json({ message: 'Restore completed' });
  } catch (err) {
    console.error('Restore error:', err);
    res.status(500).json({ message: 'Failed to restore backup', error: err.message });
  }
});

module.exports = router;
