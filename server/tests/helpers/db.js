const pool = require('../../src/db/pool');
const bcrypt = require('bcryptjs');

const TEST_PASSWORD = 'password123';
let passwordHash;

async function getPasswordHash() {
  if (!passwordHash) {
    passwordHash = await bcrypt.hash(TEST_PASSWORD, 4); // low rounds for speed
  }
  return passwordHash;
}

async function cleanTables() {
  await pool.query(`
    DELETE FROM fine_transactions;
    DELETE FROM fine_accounts;
    DELETE FROM loan_transactions;
    DELETE FROM reservations;
    DELETE FROM audit_log;
    DELETE FROM "session";
    DELETE FROM staff;
    DELETE FROM members;
    DELETE FROM books;
    DELETE FROM branch_libraries;
  `);
}

async function seedMember(overrides = {}) {
  const hash = await getPasswordHash();
  const defaults = {
    knust_id: 'STU001',
    full_name: 'Test Student',
    email: 'student@test.com',
    user_type: 'student',
    password_hash: hash,
    email_verified: true,
    account_status: 'active',
  };
  const data = { ...defaults, ...overrides };
  const result = await pool.query(
    `INSERT INTO members (knust_id, full_name, email, user_type, password_hash, email_verified, account_status)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [data.knust_id, data.full_name, data.email, data.user_type, data.password_hash, data.email_verified, data.account_status]
  );
  // Create fine account
  await pool.query('INSERT INTO fine_accounts (member_id) VALUES ($1)', [result.rows[0].id]);
  return result.rows[0];
}

async function seedStaff(overrides = {}) {
  const hash = await getPasswordHash();
  const defaults = {
    knust_staff_id: 'STAFF001',
    full_name: 'Test Librarian',
    email: 'librarian@test.com',
    role: 'librarian',
    password_hash: hash,
  };
  const data = { ...defaults, ...overrides };
  const result = await pool.query(
    `INSERT INTO staff (knust_staff_id, full_name, email, role, password_hash)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [data.knust_staff_id, data.full_name, data.email, data.role, data.password_hash]
  );
  return result.rows[0];
}

async function seedBook(overrides = {}) {
  const defaults = {
    isbn: '978-0-1234-5678-9',
    title: 'Test Book',
    author: 'Test Author',
    copies_total: 3,
    copies_available: 3,
  };
  const data = { ...defaults, ...overrides };
  const result = await pool.query(
    `INSERT INTO books (isbn, title, author, copies_total, copies_available)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [data.isbn, data.title, data.author, data.copies_total, data.copies_available]
  );
  return result.rows[0];
}

module.exports = { cleanTables, seedMember, seedStaff, seedBook, TEST_PASSWORD, pool };
