/**
 * Creates a test-ready Express app instance with rate limiting and CSRF disabled.
 */
process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = 'test-secret';

const { createApp } = require('../../src/app');

function getTestApp() {
  return createApp({ enableRateLimit: false, enableCsrf: false });
}

module.exports = { getTestApp };
