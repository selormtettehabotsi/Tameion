const crypto = require('crypto');

// Generate a CSRF token and store in session
function csrfToken(req, res, next) {
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  }
  next();
}

// Validate CSRF token on state-changing requests
function csrfProtect(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  const token = req.headers['x-csrf-token'];
  if (!token || token !== req.session.csrfToken) {
    return res.status(403).json({ success: false, data: null, message: 'Invalid CSRF token' });
  }
  next();
}

module.exports = { csrfToken, csrfProtect };
