const express = require('express');
const pool = require('../db/pool');
const logger = require('../lib/logger');
const { requireAuth, requirePatron } = require('../middleware/auth');

const router = express.Router();

function escapeILike(str) {
  return str.replace(/[%_\\]/g, '\\$&');
}

// GET /api/books — list/search/filter (public)
router.get('/', async (req, res) => {
  try {
    const { q, genre, branch, available, sort } = req.query;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const conditions = [];
    const params = [];
    let idx = 1;

    if (q) {
      conditions.push(`(b.title ILIKE $${idx} OR b.author ILIKE $${idx} OR b.isbn ILIKE $${idx})`);
      params.push(`%${escapeILike(q)}%`);
      idx++;
    }

    if (genre) {
      conditions.push(`b.genre = $${idx}`);
      params.push(genre);
      idx++;
    }

    if (branch) {
      conditions.push(`b.branch_id = $${idx}`);
      params.push(parseInt(branch));
      idx++;
    }

    if (available === 'true') {
      conditions.push('b.copies_available > 0');
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Sorting
    const sortOptions = {
      title: 'b.title ASC',
      author: 'b.author ASC',
      newest: 'b.id DESC',
    };
    const orderBy = sortOptions[sort] || 'b.title ASC';

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM books b ${where}`, params
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      `SELECT b.id, b.isbn, b.title, b.author, b.publisher, b.genre,
              b.copies_total, b.copies_available, b.shelf_location, b.cover_url,
              b.branch_id, bl.branch_name
       FROM books b
       LEFT JOIN branch_libraries bl ON bl.id = b.branch_id
       ${where}
       ORDER BY ${orderBy}
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset]
    );

    // Get distinct genres and branches for filter options
    const genresResult = await pool.query('SELECT DISTINCT genre FROM books WHERE genre IS NOT NULL ORDER BY genre');
    const branchesResult = await pool.query('SELECT id, branch_name FROM branch_libraries ORDER BY branch_name');

    res.json({
      success: true,
      data: {
        books: result.rows,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        filters: {
          genres: genresResult.rows.map(r => r.genre),
          branches: branchesResult.rows,
        },
      },
      message: '',
    });
  } catch (err) {
    logger.error({ err }, 'Books list error');
    res.status(500).json({ success: false, data: null, message: 'Server error' });
  }
});

// GET /api/books/:isbn — single book detail (public)
router.get('/:isbn', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.id, b.isbn, b.title, b.author, b.publisher, b.genre,
              b.copies_total, b.copies_available, b.shelf_location, b.cover_url,
              b.branch_id, bl.branch_name, bl.college, bl.location AS branch_location
       FROM books b
       LEFT JOIN branch_libraries bl ON bl.id = b.branch_id
       WHERE b.isbn = $1`,
      [req.params.isbn]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, data: null, message: 'Book not found' });
    }

    res.json({ success: true, data: result.rows[0], message: '' });
  } catch (err) {
    logger.error({ err }, 'Book detail error');
    res.status(500).json({ success: false, data: null, message: 'Server error' });
  }
});

// POST /api/books/:isbn/reserve — place a hold (authenticated patrons only)
router.post('/:isbn/reserve', requireAuth, requirePatron, async (req, res) => {
  try {
    const memberId = req.session.user.id;
    const { isbn } = req.params;

    // Check book exists
    const bookResult = await pool.query('SELECT isbn, copies_available, title FROM books WHERE isbn = $1', [isbn]);
    if (bookResult.rows.length === 0) {
      return res.status(404).json({ success: false, data: null, message: 'Book not found' });
    }

    const book = bookResult.rows[0];

    // Check if patron already has a pending reservation for this book
    const existingRes = await pool.query(
      `SELECT id FROM reservations WHERE book_isbn = $1 AND member_id = $2 AND status = 'pending'`,
      [isbn, memberId]
    );
    if (existingRes.rows.length > 0) {
      return res.status(409).json({ success: false, data: null, message: 'You already have a pending reservation for this book' });
    }

    // Check if patron already has this book on active loan
    const activeLoan = await pool.query(
      `SELECT id FROM loan_transactions WHERE book_isbn = $1 AND member_id = $2 AND status IN ('active', 'overdue')`,
      [isbn, memberId]
    );
    if (activeLoan.rows.length > 0) {
      return res.status(409).json({ success: false, data: null, message: 'You already have this book on loan' });
    }

    // Create reservation (7-day expiry)
    const result = await pool.query(
      `INSERT INTO reservations (book_isbn, member_id, request_date, expiry_date, status)
       VALUES ($1, $2, NOW(), NOW() + INTERVAL '7 days', 'pending')
       RETURNING id, book_isbn, request_date, expiry_date, status`,
      [isbn, memberId]
    );

    res.status(201).json({
      success: true,
      data: { ...result.rows[0], title: book.title },
      message: 'Reservation placed successfully',
    });
  } catch (err) {
    logger.error({ err }, 'Reservation error');
    res.status(500).json({ success: false, data: null, message: 'Server error' });
  }
});

module.exports = router;
