const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db/pool');
const logger = require('../lib/logger');
const { requireAuth, requireStaff } = require('../middleware/auth');
const { validate, checkoutSchema, bookSchema, bookUpdateSchema, memberUpdateSchema, staffCreateSchema, branchSchema } = require('../middleware/validate');
const { auditFromReq } = require('../lib/audit');

const router = express.Router();
const SALT_ROUNDS = 12;

function escapeILike(str) {
  return str.replace(/[%_\\]/g, '\\$&');
}

function parsePage(query) {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  return { page, limit, offset: (page - 1) * limit };
}

function paginated(rows, total, page, limit) {
  return { rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

router.use(requireAuth, requireStaff);

// ── DASHBOARD ──────────────────────────────────────────────

router.get('/dashboard', async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM members) AS total_members,
        (SELECT COUNT(*) FROM members WHERE account_status = 'active') AS active_members,
        (SELECT COUNT(*) FROM books) AS total_books,
        (SELECT COALESCE(SUM(copies_total), 0) FROM books) AS total_copies,
        (SELECT COUNT(*) FROM loan_transactions WHERE status = 'active') AS active_loans,
        (SELECT COUNT(*) FROM loan_transactions WHERE status = 'overdue') AS overdue_loans,
        (SELECT COUNT(*) FROM reservations WHERE status = 'pending') AS pending_reservations,
        (SELECT COALESCE(SUM(outstanding_balance), 0) FROM fine_accounts) AS total_fines_outstanding
    `);

    const booksByBranch = await pool.query(`
      SELECT bl.branch_name, COUNT(b.id) AS book_count, COALESCE(SUM(b.copies_total), 0) AS total_copies
      FROM branch_libraries bl
      LEFT JOIN books b ON b.branch_id = bl.id
      GROUP BY bl.id, bl.branch_name
      ORDER BY bl.branch_name
    `);

    const recentLoans = await pool.query(`
      SELECT lt.id, b.title, m.full_name AS member_name, lt.checkout_date, lt.due_date, lt.status
      FROM loan_transactions lt
      JOIN books b ON b.isbn = lt.book_isbn
      JOIN members m ON m.id = lt.member_id
      ORDER BY lt.checkout_date DESC
      LIMIT 10
    `);

    const s = stats.rows[0];
    res.json({
      success: true,
      data: {
        totalMembers: parseInt(s.total_members),
        activeMembers: parseInt(s.active_members),
        totalBooks: parseInt(s.total_books),
        totalCopies: parseInt(s.total_copies),
        activeLoans: parseInt(s.active_loans),
        overdueLoans: parseInt(s.overdue_loans),
        pendingReservations: parseInt(s.pending_reservations),
        totalFinesOutstanding: parseFloat(s.total_fines_outstanding),
        booksByBranch: booksByBranch.rows,
        recentLoans: recentLoans.rows,
      },
      message: '',
    });
  } catch (err) {
    logger.error({ err }, 'Admin dashboard error');
    res.status(500).json({ success: false, data: null, message: 'Server error' });
  }
});

// ── MEMBERS ────────────────────────────────────────────────

// List/search members
router.get('/members', async (req, res) => {
  try {
    const { q, status } = req.query;
    const { page, limit, offset } = parsePage(req.query);
    const conditions = [];
    const params = [];
    let idx = 1;

    if (q) {
      conditions.push(`(m.full_name ILIKE $${idx} OR m.knust_id ILIKE $${idx} OR m.email ILIKE $${idx})`);
      params.push(`%${escapeILike(q)}%`);
      idx++;
    }
    if (status) {
      conditions.push(`m.account_status = $${idx}`);
      params.push(status);
      idx++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await pool.query(`SELECT COUNT(*) FROM members m ${where}`, params);
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      `SELECT m.id, m.knust_id, m.full_name, m.email, m.phone, m.user_type, m.programme,
              m.account_status, m.avatar_url,
              m.avatar_data IS NOT NULL AS has_avatar, m.created_at,
              COALESCE(fa.outstanding_balance, 0) AS fine_balance
       FROM members m
       LEFT JOIN fine_accounts fa ON fa.member_id = m.id
       ${where}
       ORDER BY m.full_name ASC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset]
    );
    const p = paginated(result.rows, total, page, limit);
    res.json({ success: true, data: { members: p.rows, pagination: p.pagination }, message: '' });
  } catch (err) {
    logger.error({ err }, 'Members list error');
    res.status(500).json({ success: false, data: null, message: 'Server error' });
  }
});

// Member's uploaded profile picture, for the staff-facing member list.
router.get('/members/:id/avatar', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT avatar_data, avatar_mime FROM members WHERE id = $1',
      [req.params.id]
    );
    const row = result.rows[0];
    if (!row || !row.avatar_data) {
      return res.status(404).json({ success: false, data: null, message: 'No profile picture set' });
    }
    res.setHeader('Content-Type', row.avatar_mime);
    res.setHeader('Cache-Control', 'private, no-cache, must-revalidate');
    res.setHeader('Content-Security-Policy', "default-src 'none'; img-src 'self'");
    res.send(row.avatar_data);
  } catch (err) {
    logger.error({ err }, 'Member avatar fetch error');
    res.status(500).json({ success: false, data: null, message: 'Server error' });
  }
});

// Get single member with loan history
router.get('/members/:id', async (req, res) => {
  try {
    const member = await pool.query(
      `SELECT m.*, COALESCE(fa.outstanding_balance, 0) AS fine_balance
       FROM members m LEFT JOIN fine_accounts fa ON fa.member_id = m.id
       WHERE m.id = $1`, [req.params.id]
    );
    if (member.rows.length === 0) {
      return res.status(404).json({ success: false, data: null, message: 'Member not found' });
    }

    const loans = await pool.query(
      `SELECT lt.id, b.title, lt.checkout_date, lt.due_date, lt.return_date, lt.status
       FROM loan_transactions lt JOIN books b ON b.isbn = lt.book_isbn
       WHERE lt.member_id = $1 ORDER BY lt.checkout_date DESC`, [req.params.id]
    );

    // avatar_data is raw bytes — it must never be serialised into JSON; the
    // picture is served by GET /members/:id/avatar instead.
    const { password_hash: _pw, avatar_data: avatarData, ...memberData } = member.rows[0];
    res.json({
      success: true,
      data: { ...memberData, has_avatar: avatarData != null, loans: loans.rows },
      message: '',
    });
  } catch (err) {
    logger.error({ err }, 'Member detail error');
    res.status(500).json({ success: false, data: null, message: 'Server error' });
  }
});

// Update member
router.put('/members/:id', validate(memberUpdateSchema), async (req, res) => {
  try {
    const { full_name, email, phone, user_type, programme, account_status, avatar_url } = req.body;
    const result = await pool.query(
      `UPDATE members SET full_name = COALESCE($1, full_name), email = COALESCE($2, email),
       phone = COALESCE($3, phone), user_type = COALESCE($4, user_type),
       programme = COALESCE($5, programme), account_status = COALESCE($6, account_status),
       avatar_url = COALESCE($7, avatar_url)
       WHERE id = $8 RETURNING id, knust_id, full_name, email, user_type, account_status, avatar_url`,
      [full_name, email, phone, user_type, programme, account_status, avatar_url, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, data: null, message: 'Member not found' });
    }
    res.json({ success: true, data: result.rows[0], message: 'Member updated' });
    auditFromReq(req, 'member.update', 'member', req.params.id, { full_name: result.rows[0].full_name });
  } catch (err) {
    logger.error({ err }, 'Member update error');
    res.status(500).json({ success: false, data: null, message: 'Server error' });
  }
});

// ── CSV EXPORT ────────────────────────────────────────────

function toCsv(columns, rows) {
  const escape = (v) => {
    if (v == null) return '';
    const s = String(v);
    return s.includes(',') || s.includes('"') || s.includes('\n') ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const header = columns.map(c => escape(c.label)).join(',');
  const body = rows.map(r => columns.map(c => escape(r[c.key])).join(',')).join('\n');
  return header + '\n' + body;
}

router.get('/export/books', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.isbn, b.title, b.author, b.publisher, b.genre,
              b.copies_total, b.copies_available, b.shelf_location,
              bl.branch_name
       FROM books b LEFT JOIN branch_libraries bl ON bl.id = b.branch_id
       ORDER BY b.title`
    );
    const columns = [
      { key: 'isbn', label: 'ISBN' }, { key: 'title', label: 'Title' },
      { key: 'author', label: 'Author' }, { key: 'publisher', label: 'Publisher' },
      { key: 'genre', label: 'Genre' }, { key: 'copies_total', label: 'Total Copies' },
      { key: 'copies_available', label: 'Available' }, { key: 'shelf_location', label: 'Shelf' },
      { key: 'branch_name', label: 'Branch' },
    ];
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=books.csv');
    res.send(toCsv(columns, result.rows));
  } catch (err) {
    logger.error({ err }, 'Export books error');
    res.status(500).json({ success: false, data: null, message: 'Export failed' });
  }
});

router.get('/export/members', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT m.knust_id, m.full_name, m.email, m.phone, m.user_type,
              m.programme, m.account_status, m.created_at,
              COALESCE(fa.outstanding_balance, 0) AS fine_balance
       FROM members m LEFT JOIN fine_accounts fa ON fa.member_id = m.id
       ORDER BY m.full_name`
    );
    const columns = [
      { key: 'knust_id', label: 'KNUST ID' }, { key: 'full_name', label: 'Full Name' },
      { key: 'email', label: 'Email' }, { key: 'phone', label: 'Phone' },
      { key: 'user_type', label: 'Type' }, { key: 'programme', label: 'Programme' },
      { key: 'account_status', label: 'Status' }, { key: 'created_at', label: 'Joined' },
      { key: 'fine_balance', label: 'Fine Balance' },
    ];
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=members.csv');
    res.send(toCsv(columns, result.rows));
  } catch (err) {
    logger.error({ err }, 'Export members error');
    res.status(500).json({ success: false, data: null, message: 'Export failed' });
  }
});

// ── BOOKS CSV IMPORT ──────────────────────────────────────

function parseCsv(text) {
  const lines = [];
  let current = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') { inQuotes = false; }
      else { field += ch; }
    } else {
      if (ch === '"') { inQuotes = true; }
      else if (ch === ',') { current.push(field.trim()); field = ''; }
      else if (ch === '\n' || (ch === '\r' && text[i + 1] === '\n')) {
        current.push(field.trim()); field = '';
        if (current.some(c => c !== '')) lines.push(current);
        current = [];
        if (ch === '\r') i++;
      } else { field += ch; }
    }
  }
  current.push(field.trim());
  if (current.some(c => c !== '')) lines.push(current);

  if (lines.length < 2) return [];
  const headers = lines[0].map(h => h.toLowerCase().replace(/\s+/g, '_'));
  return lines.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i] || ''; });
    return obj;
  });
}

router.post('/import/books', express.text({ type: 'text/csv', limit: '5mb' }), async (req, res) => {
  try {
    const rows = parseCsv(req.body);
    if (rows.length === 0) {
      return res.status(400).json({ success: false, data: null, message: 'No valid rows found in CSV' });
    }

    let imported = 0;
    let skipped = 0;
    const errors = [];

    for (const row of rows) {
      const isbn = row.isbn;
      const title = row.title;
      const author = row.author;
      if (!isbn || !title || !author) { skipped++; errors.push(`Row missing required fields (isbn/title/author)`); continue; }

      const existing = await pool.query('SELECT id FROM books WHERE isbn = $1', [isbn]);
      if (existing.rows.length > 0) { skipped++; continue; }

      const copies = parseInt(row.copies_total || row.total_copies) || 1;
      let branchId = null;
      if (row.branch_name) {
        const br = await pool.query('SELECT id FROM branch_libraries WHERE branch_name ILIKE $1', [row.branch_name]);
        if (br.rows.length > 0) branchId = br.rows[0].id;
      }

      await pool.query(
        `INSERT INTO books (isbn, title, author, publisher, genre, copies_total, copies_available, shelf_location, branch_id)
         VALUES ($1, $2, $3, $4, $5, $6, $6, $7, $8)`,
        [isbn, title, author, row.publisher || null, row.genre || null, copies, row.shelf_location || row.shelf || null, branchId]
      );
      imported++;
    }

    res.json({
      success: true,
      data: { imported, skipped, total: rows.length },
      message: `Imported ${imported} books, skipped ${skipped}`,
    });
  } catch (err) {
    logger.error({ err }, 'Import books error');
    res.status(500).json({ success: false, data: null, message: 'Import failed' });
  }
});

// ── BOOKS ──────────────────────────────────────────────────

// Create book
router.post('/books', validate(bookSchema), async (req, res) => {
  try {
    const { isbn, title, author, publisher, genre, copies_total, shelf_location, cover_url, branch_id } = req.body;

    const existing = await pool.query('SELECT id FROM books WHERE isbn = $1', [isbn]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, data: null, message: 'A book with this ISBN already exists' });
    }

    const copies = copies_total || 1;
    const result = await pool.query(
      `INSERT INTO books (isbn, title, author, publisher, genre, copies_total, copies_available, shelf_location, cover_url, branch_id)
       VALUES ($1, $2, $3, $4, $5, $6, $6, $7, $8, $9)
       RETURNING *`,
      [isbn, title, author, publisher || null, genre || null, copies, shelf_location || null, cover_url || null, branch_id || null]
    );
    res.status(201).json({ success: true, data: result.rows[0], message: 'Book added' });
    auditFromReq(req, 'book.create', 'book', isbn, { title, author });
  } catch (err) {
    logger.error({ err }, 'Book create error');
    res.status(500).json({ success: false, data: null, message: 'Server error' });
  }
});

// Update book
router.put('/books/:isbn', validate(bookUpdateSchema), async (req, res) => {
  try {
    const { title, author, publisher, genre, copies_total, shelf_location, cover_url, branch_id } = req.body;

    // If copies_total changes, adjust copies_available proportionally
    const current = await pool.query('SELECT copies_total, copies_available FROM books WHERE isbn = $1', [req.params.isbn]);
    if (current.rows.length === 0) {
      return res.status(404).json({ success: false, data: null, message: 'Book not found' });
    }

    let newAvailable = current.rows[0].copies_available;
    if (copies_total !== undefined) {
      const diff = copies_total - current.rows[0].copies_total;
      newAvailable = Math.max(0, current.rows[0].copies_available + diff);
    }

    const result = await pool.query(
      `UPDATE books SET title = COALESCE($1, title), author = COALESCE($2, author),
       publisher = COALESCE($3, publisher), genre = COALESCE($4, genre),
       copies_total = COALESCE($5, copies_total), copies_available = $6,
       shelf_location = COALESCE($7, shelf_location), cover_url = COALESCE($8, cover_url),
       branch_id = COALESCE($9, branch_id)
       WHERE isbn = $10 RETURNING *`,
      [title, author, publisher, genre, copies_total, newAvailable, shelf_location, cover_url, branch_id, req.params.isbn]
    );
    res.json({ success: true, data: result.rows[0], message: 'Book updated' });
    auditFromReq(req, 'book.update', 'book', req.params.isbn, { title: result.rows[0].title });
  } catch (err) {
    logger.error({ err }, 'Book update error');
    res.status(500).json({ success: false, data: null, message: 'Server error' });
  }
});

// Delete book (only if no active loans)
router.delete('/books/:isbn', async (req, res) => {
  try {
    const activeLoans = await pool.query(
      `SELECT id FROM loan_transactions WHERE book_isbn = $1 AND status IN ('active', 'overdue')`,
      [req.params.isbn]
    );
    if (activeLoans.rows.length > 0) {
      return res.status(409).json({ success: false, data: null, message: 'Cannot delete book with active loans' });
    }

    // Delete related reservations first
    await pool.query(`DELETE FROM reservations WHERE book_isbn = $1`, [req.params.isbn]);

    const result = await pool.query('DELETE FROM books WHERE isbn = $1 RETURNING isbn, title', [req.params.isbn]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, data: null, message: 'Book not found' });
    }
    res.json({ success: true, data: result.rows[0], message: 'Book deleted' });
    auditFromReq(req, 'book.delete', 'book', req.params.isbn, { title: result.rows[0].title });
  } catch (err) {
    logger.error({ err }, 'Book delete error');
    res.status(500).json({ success: false, data: null, message: 'Server error' });
  }
});

// ── LOANS ──────────────────────────────────────────────────

// List all loans (with filters)
router.get('/loans', async (req, res) => {
  try {
    const { status, q } = req.query;
    const { page, limit, offset } = parsePage(req.query);
    const conditions = [];
    const params = [];
    let idx = 1;

    if (status) {
      conditions.push(`lt.status = $${idx}`);
      params.push(status);
      idx++;
    }
    if (q) {
      conditions.push(`(b.title ILIKE $${idx} OR m.full_name ILIKE $${idx} OR m.knust_id ILIKE $${idx})`);
      params.push(`%${escapeILike(q)}%`);
      idx++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM loan_transactions lt
       JOIN books b ON b.isbn = lt.book_isbn
       JOIN members m ON m.id = lt.member_id
       ${where}`, params
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      `SELECT lt.id, b.title, b.isbn AS book_isbn, m.full_name AS member_name, m.knust_id,
              lt.checkout_date, lt.due_date, lt.return_date, lt.status,
              (lt.due_date - CURRENT_DATE) AS days_remaining
       FROM loan_transactions lt
       JOIN books b ON b.isbn = lt.book_isbn
       JOIN members m ON m.id = lt.member_id
       ${where}
       ORDER BY lt.checkout_date DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset]
    );
    const p = paginated(result.rows, total, page, limit);
    res.json({ success: true, data: { loans: p.rows, pagination: p.pagination }, message: '' });
  } catch (err) {
    logger.error({ err }, 'Admin loans error');
    res.status(500).json({ success: false, data: null, message: 'Server error' });
  }
});

// Checkout a book
router.post('/loans/checkout', validate(checkoutSchema), async (req, res) => {
  const client = await pool.connect();
  try {
    const { book_isbn, member_knust_id, due_days } = req.body;

    await client.query('BEGIN');

    // Find member
    const memberResult = await client.query('SELECT id FROM members WHERE knust_id = $1 AND account_status = $2', [member_knust_id, 'active']);
    if (memberResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, data: null, message: 'Active member not found' });
    }

    // Check book availability (lock the row)
    const bookResult = await client.query('SELECT isbn, title, copies_available FROM books WHERE isbn = $1 FOR UPDATE', [book_isbn]);
    if (bookResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, data: null, message: 'Book not found' });
    }
    if (bookResult.rows[0].copies_available <= 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ success: false, data: null, message: 'No copies available' });
    }

    // Check if member already has this book
    const existing = await client.query(
      `SELECT id FROM loan_transactions WHERE book_isbn = $1 AND member_id = $2 AND status IN ('active', 'overdue')`,
      [book_isbn, memberResult.rows[0].id]
    );
    if (existing.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ success: false, data: null, message: 'Member already has this book on loan' });
    }

    const daysToLoan = due_days || 14;
    const staffId = req.session.user.id;

    // Create loan
    const loan = await client.query(
      `INSERT INTO loan_transactions (book_isbn, member_id, staff_id, checkout_date, due_date, status)
       VALUES ($1, $2, $3, CURRENT_DATE, CURRENT_DATE + $4 * INTERVAL '1 day', 'active')
       RETURNING *`,
      [book_isbn, memberResult.rows[0].id, staffId, daysToLoan]
    );

    // Decrement available copies
    await client.query('UPDATE books SET copies_available = copies_available - 1 WHERE isbn = $1', [book_isbn]);

    // Fulfill any pending reservation for this member+book
    await client.query(
      `UPDATE reservations SET status = 'fulfilled' WHERE book_isbn = $1 AND member_id = $2 AND status = 'pending'`,
      [book_isbn, memberResult.rows[0].id]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      data: { ...loan.rows[0], title: bookResult.rows[0].title },
      message: 'Book checked out successfully',
    });
    auditFromReq(req, 'loan.checkout', 'loan', loan.rows[0].id, { book_isbn, member_knust_id, title: bookResult.rows[0].title });
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error({ err }, 'Checkout error');
    res.status(500).json({ success: false, data: null, message: 'Server error' });
  } finally {
    client.release();
  }
});

// Return a book
router.post('/loans/:id/return', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const loan = await client.query(
      `SELECT lt.*, b.title FROM loan_transactions lt JOIN books b ON b.isbn = lt.book_isbn WHERE lt.id = $1 FOR UPDATE`,
      [req.params.id]
    );
    if (loan.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, data: null, message: 'Loan not found' });
    }
    if (loan.rows[0].status === 'returned') {
      await client.query('ROLLBACK');
      return res.status(409).json({ success: false, data: null, message: 'Book already returned' });
    }

    // Update loan
    await client.query(
      `UPDATE loan_transactions SET return_date = CURRENT_DATE, status = 'returned' WHERE id = $1`,
      [req.params.id]
    );

    // Increment available copies
    await client.query('UPDATE books SET copies_available = copies_available + 1 WHERE isbn = $1', [loan.rows[0].book_isbn]);

    // Auto-calculate fine if overdue
    const dueDate = new Date(loan.rows[0].due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);

    let fineAmount = 0;
    if (today > dueDate) {
      const daysOverdue = Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24));
      const ratePerDay = 1.00;
      fineAmount = daysOverdue * ratePerDay;

      // Ensure fine account exists
      await client.query(
        `INSERT INTO fine_accounts (member_id, outstanding_balance) VALUES ($1, 0)
         ON CONFLICT (member_id) DO NOTHING`,
        [loan.rows[0].member_id]
      );

      const fineAccount = await client.query('SELECT id FROM fine_accounts WHERE member_id = $1', [loan.rows[0].member_id]);

      await client.query(
        `INSERT INTO fine_transactions (fine_account_id, loan_transaction_id, days_overdue, rate_per_day, amount)
         VALUES ($1, $2, $3, $4, $5)`,
        [fineAccount.rows[0].id, req.params.id, daysOverdue, ratePerDay, fineAmount]
      );

      await client.query(
        'UPDATE fine_accounts SET outstanding_balance = outstanding_balance + $1, last_updated = NOW() WHERE member_id = $2',
        [fineAmount, loan.rows[0].member_id]
      );
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      data: { loanId: parseInt(req.params.id), title: loan.rows[0].title, fineAmount },
      message: fineAmount > 0 ? `Book returned. Fine of GHS ${fineAmount.toFixed(2)} applied.` : 'Book returned successfully',
    });
    auditFromReq(req, 'loan.return', 'loan', req.params.id, { title: loan.rows[0].title, fineAmount });
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error({ err }, 'Return error');
    res.status(500).json({ success: false, data: null, message: 'Server error' });
  } finally {
    client.release();
  }
});

// ── FINES ──────────────────────────────────────────────────

// List all fines
router.get('/fines', async (req, res) => {
  try {
    const { page, limit, offset } = parsePage(req.query);

    const countResult = await pool.query('SELECT COUNT(*) FROM fine_transactions');
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      `SELECT ft.id, b.title, m.full_name AS member_name, m.knust_id,
              ft.days_overdue, ft.rate_per_day, ft.amount, ft.settled, ft.settlement_date
       FROM fine_transactions ft
       JOIN fine_accounts fa ON fa.id = ft.fine_account_id
       JOIN members m ON m.id = fa.member_id
       JOIN loan_transactions lt ON lt.id = ft.loan_transaction_id
       JOIN books b ON b.isbn = lt.book_isbn
       ORDER BY ft.settled ASC, ft.id DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    const p = paginated(result.rows, total, page, limit);
    res.json({ success: true, data: { fines: p.rows, pagination: p.pagination }, message: '' });
  } catch (err) {
    logger.error({ err }, 'Admin fines error');
    res.status(500).json({ success: false, data: null, message: 'Server error' });
  }
});

// Record fine payment
router.post('/fines/:id/pay', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const fine = await client.query(
      `SELECT ft.*, fa.member_id, fa.outstanding_balance FROM fine_transactions ft
       JOIN fine_accounts fa ON fa.id = ft.fine_account_id
       WHERE ft.id = $1 FOR UPDATE`,
      [req.params.id]
    );
    if (fine.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, data: null, message: 'Fine not found' });
    }
    if (fine.rows[0].settled) {
      await client.query('ROLLBACK');
      return res.status(409).json({ success: false, data: null, message: 'Fine already settled' });
    }

    await client.query(
      `UPDATE fine_transactions SET settled = TRUE, settlement_date = CURRENT_DATE WHERE id = $1`,
      [req.params.id]
    );

    // Subtract but floor at zero to prevent negative balance
    const newBalance = Math.max(0, parseFloat(fine.rows[0].outstanding_balance) - parseFloat(fine.rows[0].amount));
    await client.query(
      `UPDATE fine_accounts SET outstanding_balance = $1, last_updated = NOW() WHERE member_id = $2`,
      [newBalance, fine.rows[0].member_id]
    );

    await client.query('COMMIT');

    res.json({ success: true, data: { id: parseInt(req.params.id) }, message: 'Fine payment recorded' });
    auditFromReq(req, 'fine.pay', 'fine', req.params.id, { amount: fine.rows[0].amount });
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error({ err }, 'Fine pay error');
    res.status(500).json({ success: false, data: null, message: 'Server error' });
  } finally {
    client.release();
  }
});

// ── RESERVATIONS ──────────────────────────────────────────

// List all reservations (paginated, filterable by status)
router.get('/reservations', async (req, res) => {
  try {
    const { status, q } = req.query;
    const { page, limit, offset } = parsePage(req.query);
    const conditions = [];
    const params = [];
    let idx = 1;

    if (status) {
      conditions.push(`r.status = $${idx}`);
      params.push(status);
      idx++;
    }
    if (q) {
      conditions.push(`(b.title ILIKE $${idx} OR m.full_name ILIKE $${idx} OR m.knust_id ILIKE $${idx})`);
      params.push(`%${escapeILike(q)}%`);
      idx++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM reservations r
       JOIN books b ON b.isbn = r.book_isbn
       JOIN members m ON m.id = r.member_id
       ${where}`, params
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      `SELECT r.id, b.title, b.isbn AS book_isbn, b.copies_available,
              m.full_name AS member_name, m.knust_id,
              r.request_date, r.expiry_date, r.status
       FROM reservations r
       JOIN books b ON b.isbn = r.book_isbn
       JOIN members m ON m.id = r.member_id
       ${where}
       ORDER BY r.status = 'pending' DESC, r.request_date DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset]
    );
    const p = paginated(result.rows, total, page, limit);
    res.json({ success: true, data: { reservations: p.rows, pagination: p.pagination }, message: '' });
  } catch (err) {
    logger.error({ err }, 'Admin reservations error');
    res.status(500).json({ success: false, data: null, message: 'Server error' });
  }
});

// Fulfill reservation (mark as fulfilled — the checkout itself is a separate step)
router.post('/reservations/:id/fulfill', async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE reservations SET status = 'fulfilled'
       WHERE id = $1 AND status = 'pending'
       RETURNING id, book_isbn, member_id`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, data: null, message: 'Pending reservation not found' });
    }
    res.json({ success: true, data: result.rows[0], message: 'Reservation fulfilled' });
  } catch (err) {
    logger.error({ err }, 'Reservation fulfill error');
    res.status(500).json({ success: false, data: null, message: 'Server error' });
  }
});

// Cancel reservation
router.post('/reservations/:id/cancel', async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE reservations SET status = 'expired'
       WHERE id = $1 AND status = 'pending'
       RETURNING id`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, data: null, message: 'Pending reservation not found' });
    }
    res.json({ success: true, data: result.rows[0], message: 'Reservation cancelled' });
  } catch (err) {
    logger.error({ err }, 'Reservation cancel error');
    res.status(500).json({ success: false, data: null, message: 'Server error' });
  }
});

// ── LOANS — RENEWAL ───────────────────────────────────────

// Renew (extend) a loan's due date
router.post('/loans/:id/renew', async (req, res) => {
  const client = await pool.connect();
  try {
    const { days } = req.body;
    const extension = Math.min(30, Math.max(1, parseInt(days) || 14));

    await client.query('BEGIN');

    const loan = await client.query(
      `SELECT lt.*, b.title FROM loan_transactions lt
       JOIN books b ON b.isbn = lt.book_isbn
       WHERE lt.id = $1 FOR UPDATE`,
      [req.params.id]
    );
    if (loan.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, data: null, message: 'Loan not found' });
    }
    if (loan.rows[0].status === 'returned') {
      await client.query('ROLLBACK');
      return res.status(409).json({ success: false, data: null, message: 'Cannot renew a returned loan' });
    }

    // Extend from the later of current due_date or today
    const result = await client.query(
      `UPDATE loan_transactions
       SET due_date = GREATEST(due_date, CURRENT_DATE) + $1 * INTERVAL '1 day',
           status = 'active'
       WHERE id = $2
       RETURNING id, due_date, status`,
      [extension, req.params.id]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      data: { loanId: parseInt(req.params.id), title: loan.rows[0].title, newDueDate: result.rows[0].due_date },
      message: `Loan renewed — new due date: ${new Date(result.rows[0].due_date).toLocaleDateString()}`,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error({ err }, 'Loan renew error');
    res.status(500).json({ success: false, data: null, message: 'Server error' });
  } finally {
    client.release();
  }
});

// ── STAFF ─────────────────────────────────────────────────

// List all staff
router.get('/staff', async (req, res) => {
  try {
    const { page, limit, offset } = parsePage(req.query);
    const countResult = await pool.query('SELECT COUNT(*) FROM staff');
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      `SELECT s.id, s.knust_staff_id, s.full_name, s.email, s.role,
              s.branch_id, bl.branch_name, s.created_at
       FROM staff s
       LEFT JOIN branch_libraries bl ON bl.id = s.branch_id
       ORDER BY s.full_name ASC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    const p = paginated(result.rows, total, page, limit);
    res.json({ success: true, data: { staff: p.rows, pagination: p.pagination }, message: '' });
  } catch (err) {
    logger.error({ err }, 'Staff list error');
    res.status(500).json({ success: false, data: null, message: 'Server error' });
  }
});

// Create staff member
router.post('/staff', validate(staffCreateSchema), async (req, res) => {
  try {
    const { knust_staff_id, full_name, email, password, role, branch_id } = req.body;

    const existing = await pool.query('SELECT id FROM staff WHERE knust_staff_id = $1', [knust_staff_id]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, data: null, message: 'Staff ID already exists' });
    }

    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    const result = await pool.query(
      `INSERT INTO staff (knust_staff_id, full_name, email, role, branch_id, password_hash)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, knust_staff_id, full_name, email, role, branch_id, created_at`,
      [knust_staff_id, full_name, email, role || 'librarian', branch_id || null, hash]
    );
    res.status(201).json({ success: true, data: result.rows[0], message: 'Staff member added' });
    auditFromReq(req, 'staff.create', 'staff', result.rows[0].id, { knust_staff_id, full_name, role: role || 'librarian' });
  } catch (err) {
    logger.error({ err }, 'Staff create error');
    res.status(500).json({ success: false, data: null, message: 'Server error' });
  }
});

// Update staff member
router.put('/staff/:id', async (req, res) => {
  try {
    const { full_name, email, role, branch_id } = req.body;
    const result = await pool.query(
      `UPDATE staff SET full_name = COALESCE($1, full_name), email = COALESCE($2, email),
       role = COALESCE($3, role), branch_id = COALESCE($4, branch_id)
       WHERE id = $5
       RETURNING id, knust_staff_id, full_name, email, role, branch_id, created_at`,
      [full_name, email, role, branch_id, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, data: null, message: 'Staff member not found' });
    }
    res.json({ success: true, data: result.rows[0], message: 'Staff member updated' });
  } catch (err) {
    logger.error({ err }, 'Staff update error');
    res.status(500).json({ success: false, data: null, message: 'Server error' });
  }
});

// ── REPORTS / ANALYTICS ───────────────────────────────────

router.get('/reports', async (req, res) => {
  try {
    // Loan activity over last 12 months
    const loansByMonth = await pool.query(`
      SELECT TO_CHAR(checkout_date, 'YYYY-MM') AS month,
             COUNT(*) AS checkouts,
             COUNT(*) FILTER (WHERE status = 'returned') AS returns
      FROM loan_transactions
      WHERE checkout_date >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY month ORDER BY month
    `);

    // Top 10 most borrowed books
    const topBooks = await pool.query(`
      SELECT b.title, b.isbn, COUNT(lt.id) AS borrow_count
      FROM loan_transactions lt JOIN books b ON b.isbn = lt.book_isbn
      GROUP BY b.title, b.isbn ORDER BY borrow_count DESC LIMIT 10
    `);

    // Genre distribution
    const genreDistribution = await pool.query(`
      SELECT COALESCE(genre, 'Unclassified') AS genre, COUNT(*) AS count
      FROM books GROUP BY genre ORDER BY count DESC
    `);

    // Member registrations over last 12 months
    const membersByMonth = await pool.query(`
      SELECT TO_CHAR(created_at, 'YYYY-MM') AS month, COUNT(*) AS count
      FROM members
      WHERE created_at >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY month ORDER BY month
    `);

    // Fine revenue
    const fineStats = await pool.query(`
      SELECT COALESCE(SUM(amount), 0) AS total_fines,
             COALESCE(SUM(amount) FILTER (WHERE settled), 0) AS collected,
             COALESCE(SUM(amount) FILTER (WHERE NOT settled), 0) AS outstanding
      FROM fine_transactions
    `);

    // Overdue rate
    const overdueRate = await pool.query(`
      SELECT COUNT(*) AS total,
             COUNT(*) FILTER (WHERE status = 'overdue' OR (status = 'returned' AND return_date > due_date)) AS overdue_count
      FROM loan_transactions
    `);

    res.json({
      success: true,
      data: {
        loansByMonth: loansByMonth.rows,
        topBooks: topBooks.rows,
        genreDistribution: genreDistribution.rows,
        membersByMonth: membersByMonth.rows,
        fineStats: fineStats.rows[0],
        overdueRate: overdueRate.rows[0],
      },
      message: '',
    });
  } catch (err) {
    logger.error({ err }, 'Reports error');
    res.status(500).json({ success: false, data: null, message: 'Server error' });
  }
});

// ── AUDIT LOG ─────────────────────────────────────────────

router.get('/audit-log', async (req, res) => {
  try {
    const { action, q } = req.query;
    const { page, limit, offset } = parsePage(req.query);
    const conditions = [];
    const params = [];
    let idx = 1;

    if (action) {
      conditions.push(`a.action = $${idx}`);
      params.push(action);
      idx++;
    }
    if (q) {
      conditions.push(`(a.actor_name ILIKE $${idx} OR a.action ILIKE $${idx} OR a.entity_id ILIKE $${idx})`);
      params.push(`%${escapeILike(q)}%`);
      idx++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await pool.query(`SELECT COUNT(*) FROM audit_log a ${where}`, params);
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      `SELECT a.id, a.actor_type, a.actor_name, a.action, a.entity_type, a.entity_id,
              a.details, a.ip_address, a.created_at
       FROM audit_log a ${where}
       ORDER BY a.created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset]
    );
    const p = paginated(result.rows, total, page, limit);
    res.json({ success: true, data: { entries: p.rows, pagination: p.pagination }, message: '' });
  } catch (err) {
    logger.error({ err }, 'Audit log error');
    res.status(500).json({ success: false, data: null, message: 'Server error' });
  }
});

// ── BRANCHES ───────────────────────────────────────────────

router.get('/branches', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM branch_libraries ORDER BY branch_name');
    res.json({ success: true, data: result.rows, message: '' });
  } catch (err) {
    logger.error({ err }, 'Branches list error');
    res.status(500).json({ success: false, data: null, message: 'Server error' });
  }
});

router.post('/branches', validate(branchSchema), async (req, res) => {
  try {
    const { branch_name, college, location } = req.body;
    const result = await pool.query(
      'INSERT INTO branch_libraries (branch_name, college, location) VALUES ($1, $2, $3) RETURNING *',
      [branch_name, college, location || null]
    );
    res.status(201).json({ success: true, data: result.rows[0], message: 'Branch added' });
  } catch (err) {
    logger.error({ err }, 'Branch create error');
    res.status(500).json({ success: false, data: null, message: 'Server error' });
  }
});

router.put('/branches/:id', async (req, res) => {
  try {
    const { branch_name, college, location } = req.body;
    const result = await pool.query(
      `UPDATE branch_libraries SET branch_name = COALESCE($1, branch_name),
       college = COALESCE($2, college), location = COALESCE($3, location)
       WHERE id = $4 RETURNING *`,
      [branch_name, college, location, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, data: null, message: 'Branch not found' });
    }
    res.json({ success: true, data: result.rows[0], message: 'Branch updated' });
  } catch (err) {
    logger.error({ err }, 'Branch update error');
    res.status(500).json({ success: false, data: null, message: 'Server error' });
  }
});

module.exports = router;
