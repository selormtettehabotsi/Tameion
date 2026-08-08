const express = require('express');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const cors = require('cors');
const pinoHttp = require('pino-http');
const pool = require('./db/pool');
const logger = require('./lib/logger');
const { globalLimiter } = require('./middleware/rateLimit');
const { csrfToken, csrfProtect } = require('./middleware/csrf');

const authRoutes = require('./routes/auth');
const patronRoutes = require('./routes/patron');
const booksRoutes = require('./routes/books');
const adminRoutes = require('./routes/admin');

function createApp({ enableRateLimit = true, enableCsrf = true } = {}) {
  const app = express();

  // Security headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  // Request logging (skip in test)
  if (process.env.NODE_ENV !== 'test') {
    app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === '/api/health' } }));
  }

  // Middleware
  app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
  }));
  app.use(express.json({ limit: '1mb' }));

  if (enableRateLimit) {
    app.use(globalLimiter);
  }

  app.use(session({
    store: new pgSession({ pool, tableName: 'session' }),
    secret: process.env.SESSION_SECRET || 'test-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
    },
  }));

  if (enableCsrf) {
    app.use(csrfToken);

    app.use('/api/auth', (req, res, next) => {
      const csrfExemptPaths = ['/login', '/forgot-password', '/reset-password', '/verify-email'];
      if (csrfExemptPaths.includes(req.path) || req.method === 'GET') {
        return next();
      }
      return csrfProtect(req, res, next);
    }, authRoutes);

    app.use('/api/patron', csrfProtect, patronRoutes);
    app.use('/api/books', csrfProtect, booksRoutes);
    app.use('/api/admin', csrfProtect, adminRoutes);
  } else {
    // Test mode: mount routes without CSRF
    app.use('/api/auth', authRoutes);
    app.use('/api/patron', patronRoutes);
    app.use('/api/books', booksRoutes);
    app.use('/api/admin', adminRoutes);
  }

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ success: true, data: null, message: 'Tameion server running' });
  });

  return app;
}

module.exports = { createApp };
