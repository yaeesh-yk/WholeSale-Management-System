const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const verifyToken = require('../middleware/auth');
const ctrl = require('../controllers/products');

router.use(verifyToken);

router.get('/', ctrl.getAll);
router.post('/', [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
], ctrl.create);
router.put('/:id', [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
], ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
