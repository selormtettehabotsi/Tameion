const express = require('express');
const pool = require('../db/pool');
const { requireAuth, requirePatron } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth, requirePatron);

// GET /api/patron/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const memberId = req.session.user.id;

    // Active loans with book title
    const loansResult = await pool.query(
      `SELECT lt.id, b.title, lt.checkout_date, lt.due_date, lt.status,
              (lt.due_date - CURRENT_DATE) AS days_remaining
       FROM loan_transactions lt
       JOIN books b ON b.isbn = lt.book_isbn
       WHERE lt.member_id = $1 AND lt.status IN ('active', 'overdue')
       ORDER BY lt.due_date ASC`,
      [memberId]
    );

    // Fine balance
    const fineResult = await pool.query(
      'SELECT outstanding_balance FROM fine_accounts WHERE member_id = $1',
      [memberId]
    );
    const fineBalance = fineResult.rows[0]?.outstanding_balance || 0;

    // Pending reservations
    const reservationsResult = await pool.query(
      `SELECT r.id, b.title, r.request_date, r.expiry_date, r.status
       FROM reservations r
       JOIN books b ON b.isbn = r.book_isbn
       WHERE r.member_id = $1 AND r.status = 'pending'
       ORDER BY r.request_date DESC`,
      [memberId]
    );

    // Stats
    const statsResult = await pool.query(
      `SELECT
         COUNT(*) AS total_borrowed,
         COUNT(*) FILTER (WHERE status IN ('active', 'overdue')) AS currently_on_loan,
         COUNT(*) FILTER (WHERE status = 'overdue') AS overdue_count
       FROM loan_transactions WHERE member_id = $1`,
      [memberId]
    );

    const stats = statsResult.rows[0];

    res.json({
      success: true,
      data: {
        activeLoans: loansResult.rows,
        fineBalance: parseFloat(fineBalance),
        pendingReservations: reservationsResult.rows,
        stats: {
          totalBorrowed: parseInt(stats.total_borrowed),
          currentlyOnLoan: parseInt(stats.currently_on_loan),
          overdueCount: parseInt(stats.overdue_count),
        },
      },
      message: '',
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ success: false, data: null, message: 'Server error' });
  }
});

// GET /api/patron/loans
router.get('/loans', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM loan_transactions WHERE member_id = $1',
      [req.session.user.id]
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      `SELECT lt.id, b.title, lt.checkout_date, lt.due_date, lt.return_date, lt.status
       FROM loan_transactions lt
       JOIN books b ON b.isbn = lt.book_isbn
       WHERE lt.member_id = $1
       ORDER BY lt.checkout_date DESC
       LIMIT $2 OFFSET $3`,
      [req.session.user.id, limit, offset]
    );
    res.json({
      success: true,
      data: {
        loans: result.rows,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
      message: '',
    });
  } catch (err) {
    console.error('Loans error:', err);
    res.status(500).json({ success: false, data: null, message: 'Server error' });
  }
});

// GET /api/patron/fines
router.get('/fines', async (req, res) => {
  try {
    const memberId = req.session.user.id;

    const accountResult = await pool.query(
      'SELECT id, outstanding_balance FROM fine_accounts WHERE member_id = $1',
      [memberId]
    );

    if (accountResult.rows.length === 0) {
      return res.json({ success: true, data: { balance: 0, transactions: [] }, message: '' });
    }

    const account = accountResult.rows[0];

    const txResult = await pool.query(
      `SELECT ft.id, b.title, ft.days_overdue, ft.rate_per_day, ft.amount, ft.settled, ft.settlement_date
       FROM fine_transactions ft
       JOIN loan_transactions lt ON lt.id = ft.loan_transaction_id
       JOIN books b ON b.isbn = lt.book_isbn
       WHERE ft.fine_account_id = $1
       ORDER BY ft.id DESC`,
      [account.id]
    );

    res.json({
      success: true,
      data: {
        balance: parseFloat(account.outstanding_balance),
        transactions: txResult.rows,
      },
      message: '',
    });
  } catch (err) {
    console.error('Fines error:', err);
    res.status(500).json({ success: false, data: null, message: 'Server error' });
  }
});

// GET /api/patron/reservations
router.get('/reservations', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.id, b.title, r.request_date, r.expiry_date, r.status
       FROM reservations r
       JOIN books b ON b.isbn = r.book_isbn
       WHERE r.member_id = $1
       ORDER BY r.request_date DESC`,
      [req.session.user.id]
    );
    res.json({ success: true, data: result.rows, message: '' });
  } catch (err) {
    console.error('Reservations error:', err);
    res.status(500).json({ success: false, data: null, message: 'Server error' });
  }
});

module.exports = router;
