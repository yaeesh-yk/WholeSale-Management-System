const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const verifyToken = require('../middleware/auth');
const ctrl = require('../controllers/shopkeepers');

router.use(verifyToken);

router.get('/', ctrl.getAll);
router.post('/', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('phone').trim().notEmpty().withMessage('Phone is required'),
], ctrl.create);
router.put('/:id', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('phone').trim().notEmpty().withMessage('Phone is required'),
], ctrl.update);
router.delete('/:id', ctrl.remove);
router.get('/:id/history', ctrl.getHistory);

module.exports = router;
