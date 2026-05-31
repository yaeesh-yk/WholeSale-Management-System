const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const loginAttempts = new Map();
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 5;

const loginRateLimit = (req, res, next) => {
  const key = `${req.ip}:${String(req.body?.username || '').toLowerCase()}`;
  const now = Date.now();
  const record = loginAttempts.get(key);

  if (!record || record.resetAt <= now) {
    loginAttempts.set(key, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    req.loginRateLimitKey = key;
    return next();
  }

  if (record.count >= MAX_LOGIN_ATTEMPTS) {
    const retryAfterSeconds = Math.ceil((record.resetAt - now) / 1000);
    res.set('Retry-After', String(retryAfterSeconds));
    return res.status(429).json({ message: 'Too many login attempts. Please try again later.' });
  }

  record.count += 1;
  req.loginRateLimitKey = key;
  next();
};

router.post('/login', [
  loginRateLimit,
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    if (req.loginRateLimitKey) loginAttempts.delete(req.loginRateLimitKey);

    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );
    res.json({ token, username: user.username });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
