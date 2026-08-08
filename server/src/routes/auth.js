const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const pool = require('../db/pool');
const logger = require('../lib/logger');
const { authLimiter } = require('../middleware/rateLimit');
const { requireAuth } = require('../middleware/auth');
const { validate, registerSchema, avatarUploadSchema, decodeAvatar } = require('../middleware/validate');
const { auditFromReq } = require('../lib/audit');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/email');

const router = express.Router();
const SALT_ROUNDS = 12;

// GET /api/auth/csrf-token
router.get('/csrf-token', (req, res) => {
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  }
  res.json({ success: true, data: { token: req.session.csrfToken }, message: '' });
});

// POST /api/auth/register
router.post('/register', authLimiter, validate(registerSchema), async (req, res) => {
  try {
    const { knust_id, full_name, email, phone, user_type, programme, password } = req.body;

    const existing = await pool.query('SELECT id FROM members WHERE knust_id = $1', [knust_id]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, data: null, message: 'ID already registered' });
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    const email_token = crypto.randomBytes(32).toString('hex');
    const email_token_expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const result = await pool.query(
      `INSERT INTO members (knust_id, full_name, email, phone, user_type, programme, password_hash, email_token, email_token_expires)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id, knust_id, full_name, email, user_type`,
      [knust_id, full_name, email, phone || null, user_type, programme || null, password_hash, email_token, email_token_expires]
    );

    await pool.query('INSERT INTO fine_accounts (member_id) VALUES ($1)', [result.rows[0].id]);

    // Send verification email (logs to console if SMTP not configured)
    await sendVerificationEmail(email, full_name, email_token);

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Registration successful. Please check your email to verify your account.',
    });
  } catch (err) {
    logger.error({ err }, 'Register error');
    res.status(500).json({ success: false, data: null, message: 'Server error' });
  }
});

// POST /api/auth/verify-email
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, data: null, message: 'Token is required' });
    }

    const result = await pool.query(
      'SELECT id, email_verified FROM members WHERE email_token = $1 AND email_token_expires > NOW()',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ success: false, data: null, message: 'Invalid or expired verification token' });
    }

    if (result.rows[0].email_verified) {
      return res.json({ success: true, data: null, message: 'Email already verified' });
    }

    await pool.query(
      'UPDATE members SET email_verified = TRUE, email_token = NULL, email_token_expires = NULL WHERE id = $1',
      [result.rows[0].id]
    );

    res.json({ success: true, data: null, message: 'Email verified successfully' });
  } catch (err) {
    logger.error({ err }, 'Verify email error');
    res.status(500).json({ success: false, data: null, message: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ success: false, data: null, message: 'ID and password are required' });
    }

    // Check members first
    let result = await pool.query(
      'SELECT id, knust_id, full_name, user_type, password_hash, email_verified, account_status FROM members WHERE knust_id = $1',
      [identifier]
    );
    let user = result.rows[0];
    let isStaff = false;

    // If not found in members, check staff
    if (!user) {
      result = await pool.query(
        'SELECT id, knust_staff_id, full_name, role, password_hash FROM staff WHERE knust_staff_id = $1',
        [identifier]
      );
      user = result.rows[0];
      isStaff = true;
    }

    if (!user) {
      return res.status(401).json({ success: false, data: null, message: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ success: false, data: null, message: 'Invalid credentials' });
    }

    // Check account status for members
    if (!isStaff && user.account_status !== 'active') {
      return res.status(403).json({ success: false, data: null, message: 'Account is suspended' });
    }

    req.session.user = {
      id: user.id,
      name: user.full_name,
      role: isStaff ? user.role : user.user_type,
      knust_id: isStaff ? user.knust_staff_id : user.knust_id,
      isStaff,
      emailVerified: isStaff ? true : user.email_verified,
    };

    // Generate CSRF token on login
    req.session.csrfToken = crypto.randomBytes(32).toString('hex');

    res.json({
      success: true,
      data: {
        id: user.id,
        name: user.full_name,
        role: req.session.user.role,
        knust_id: req.session.user.knust_id,
        isStaff,
        emailVerified: req.session.user.emailVerified,
        csrfToken: req.session.csrfToken,
      },
      message: 'Login successful',
    });
  } catch (err) {
    logger.error({ err }, 'Login error');
    res.status(500).json({ success: false, data: null, message: 'Server error' });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', authLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, data: null, message: 'Email is required' });
    }

    const result = await pool.query('SELECT id, full_name FROM members WHERE email = $1', [email]);

    // Always return success to prevent email enumeration
    if (result.rows.length === 0) {
      return res.json({ success: true, data: null, message: 'If an account with that email exists, a reset link has been sent' });
    }

    const reset_token = crypto.randomBytes(32).toString('hex');
    const reset_token_expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await pool.query(
      'UPDATE members SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
      [reset_token, reset_token_expires, result.rows[0].id]
    );

    // Send password reset email (logs to console if SMTP not configured)
    await sendPasswordResetEmail(email, result.rows[0].full_name, reset_token);

    res.json({
      success: true,
      data: null,
      message: 'If an account with that email exists, a reset link has been sent',
    });
  } catch (err) {
    logger.error({ err }, 'Forgot password error');
    res.status(500).json({ success: false, data: null, message: 'Server error' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', authLimiter, async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ success: false, data: null, message: 'Token and new password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, data: null, message: 'Password must be at least 8 characters' });
    }

    const result = await pool.query(
      'SELECT id FROM members WHERE reset_token = $1 AND reset_token_expires > NOW()',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ success: false, data: null, message: 'Invalid or expired reset token' });
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    await pool.query(
      'UPDATE members SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2',
      [password_hash, result.rows[0].id]
    );

    res.json({ success: true, data: null, message: 'Password has been reset successfully' });
  } catch (err) {
    logger.error({ err }, 'Reset password error');
    res.status(500).json({ success: false, data: null, message: 'Server error' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ success: false, data: null, message: 'Logout failed' });
    }
    res.clearCookie('connect.sid');
    res.json({ success: true, data: null, message: 'Logged out' });
  });
});

// GET /api/auth/me
router.get('/me', async (req, res) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ success: false, data: null, message: 'Not authenticated' });
  }
  // hasAvatar is read live rather than cached on the session, so it is correct
  // immediately after an upload or removal.
  let hasAvatar = false;
  try {
    const table = req.session.user.isStaff ? 'staff' : 'members';
    const result = await pool.query(
      `SELECT avatar_data IS NOT NULL AS has_avatar FROM ${table} WHERE id = $1`,
      [req.session.user.id]
    );
    hasAvatar = result.rows[0]?.has_avatar ?? false;
  } catch (err) {
    logger.error({ err }, 'Avatar presence lookup failed');
  }

  res.json({
    success: true,
    data: { ...req.session.user, hasAvatar, csrfToken: req.session.csrfToken },
    message: '',
  });
});

// ── PROFILE PICTURE ────────────────────────────────────────
//
// Everyone with an account manages their own picture through these three
// routes; the session decides which table is touched, so patrons and staff
// share one implementation.

/** Which table the signed-in user lives in. Never taken from the request. */
function ownerTable(req) {
  return req.session.user.isStaff ? 'staff' : 'members';
}

// GET /api/auth/avatar — the signed-in user's own picture
router.get('/avatar', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT avatar_data, avatar_mime FROM ${ownerTable(req)} WHERE id = $1`,
      [req.session.user.id]
    );
    const row = result.rows[0];
    if (!row || !row.avatar_data) {
      return res.status(404).json({ success: false, data: null, message: 'No profile picture set' });
    }
    // Private: an avatar is personal data, so proxies must not cache it.
    res.setHeader('Content-Type', row.avatar_mime);
    res.setHeader('Cache-Control', 'private, no-cache, must-revalidate');
    res.setHeader('Content-Security-Policy', "default-src 'none'; img-src 'self'");
    res.send(row.avatar_data);
  } catch (err) {
    logger.error({ err }, 'Avatar fetch error');
    res.status(500).json({ success: false, data: null, message: 'Server error' });
  }
});

// POST /api/auth/avatar — replace the signed-in user's picture
router.post('/avatar', requireAuth, validate(avatarUploadSchema), async (req, res) => {
  try {
    const decoded = decodeAvatar(req.body);
    if (decoded.error) {
      return res.status(400).json({ success: false, data: null, message: decoded.error });
    }

    const result = await pool.query(
      `UPDATE ${ownerTable(req)} SET avatar_data = $1, avatar_mime = $2 WHERE id = $3 RETURNING id`,
      [decoded.buffer, decoded.mime, req.session.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, data: null, message: 'Account not found' });
    }

    res.json({
      success: true,
      data: { hasAvatar: true, bytes: decoded.buffer.length },
      message: 'Profile picture updated',
    });
    auditFromReq(req, 'avatar.update', ownerTable(req), req.session.user.id, {
      bytes: decoded.buffer.length,
      mime: decoded.mime,
    });
  } catch (err) {
    logger.error({ err }, 'Avatar upload error');
    res.status(500).json({ success: false, data: null, message: 'Server error' });
  }
});

// DELETE /api/auth/avatar — revert to initials
router.delete('/avatar', requireAuth, async (req, res) => {
  try {
    await pool.query(
      `UPDATE ${ownerTable(req)} SET avatar_data = NULL, avatar_mime = NULL WHERE id = $1`,
      [req.session.user.id]
    );
    res.json({ success: true, data: { hasAvatar: false }, message: 'Profile picture removed' });
    auditFromReq(req, 'avatar.delete', ownerTable(req), req.session.user.id, null);
  } catch (err) {
    logger.error({ err }, 'Avatar delete error');
    res.status(500).json({ success: false, data: null, message: 'Server error' });
  }
});

module.exports = router;
