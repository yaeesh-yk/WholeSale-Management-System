const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const verifyToken = require('../middleware/auth');
const ctrl = require('../controllers/orders');

router.use(verifyToken);

router.get('/', ctrl.getAll);
router.post('/', [
  body('shopkeeperId').notEmpty().withMessage('Shopkeeper is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.productId').notEmpty().withMessage('Product ID required for each item'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
], ctrl.create);
router.get('/:id', ctrl.getOne);
router.put('/:id', [
  body('shopkeeperId').notEmpty().withMessage('Shopkeeper is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.productId').notEmpty().withMessage('Product ID required for each item'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
], ctrl.update);

module.exports = router;
