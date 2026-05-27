const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const ctrl = require('../controllers/dashboard');

router.use(verifyToken);
router.get('/', ctrl.getDashboard);

module.exports = router;
