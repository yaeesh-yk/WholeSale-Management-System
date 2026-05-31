const express = require('express');
const router = express.Router();

const Shopkeeper = require('../models/Shopkeeper');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Counter = require('../models/Counter');
const verifyToken = require('../middleware/auth');

router.use(verifyToken);

// GET /api/backup
router.get('/', async (req, res) => {
  try {
    const [shopkeepers, products, orders, payments, counters] = await Promise.all([
      Shopkeeper.find().lean(),
      Product.find().lean(),
      Order.find().lean(),
      Payment.find().lean(),
      Counter.find().lean(),
    ]);

    res.json({ shopkeepers, products, orders, payments, counters });
  } catch (err) {
    console.error('Backup error:', err);
    res.status(500).json({ message: 'Failed to create backup', error: err.message });
  }
});

module.exports = router;
