const rateLimit = require('express-rate-limit');

// Limiters are mounted at module scope inside routes/auth.js, so the
// createApp({ enableRateLimit: false }) switch cannot reach them. Skipping
// under NODE_ENV=test keeps the test suite deterministic (a run makes far more
// than 10 auth requests) while leaving production behaviour untouched.
const skipInTest = () => process.env.NODE_ENV === 'test';

// Global: 100 requests per 15 minutes per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
  message: { success: false, data: null, message: 'Too many requests, please try again later' },
});

// Auth endpoints: 10 attempts per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
  message: { success: false, data: null, message: 'Too many login attempts, please try again later' },
});

module.exports = { globalLimiter, authLimiter };
