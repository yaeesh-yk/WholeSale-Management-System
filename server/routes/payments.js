const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const verifyToken = require('../middleware/auth');
const ctrl = require('../controllers/payments');

router.use(verifyToken);

router.post('/', [
  body('orderId').notEmpty().withMessage('Order ID is required'),
  body('shopkeeperId').notEmpty().withMessage('Shopkeeper ID is required'),
  body('amountPaid').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
], ctrl.create);
router.get('/shopkeeper/:shopkeeperId', ctrl.getByShopkeeper);
router.get('/', ctrl.getAll);

module.exports = router;
