-- Tameion Database Schema

-- Session store (required by connect-pg-simple)
CREATE TABLE IF NOT EXISTS "session" (
  "sid" VARCHAR NOT NULL PRIMARY KEY,
  "sess" JSON NOT NULL,
  "expire" TIMESTAMP(6) NOT NULL
);
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");

-- Branch libraries
CREATE TABLE branch_libraries (
  id SERIAL PRIMARY KEY,
  branch_name VARCHAR(200) NOT NULL,
  college VARCHAR(200) NOT NULL,
  location VARCHAR(300)
);

-- Members (patrons)
CREATE TABLE members (
  id SERIAL PRIMARY KEY,
  knust_id VARCHAR(30) UNIQUE NOT NULL,
  full_name VARCHAR(200) NOT NULL,
  email VARCHAR(200) NOT NULL,
  phone VARCHAR(20),
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('student', 'faculty', 'postgraduate')),
  programme VARCHAR(200),
  account_status VARCHAR(20) NOT NULL DEFAULT 'active',
  avatar_url VARCHAR(500),
  avatar_data BYTEA,
  avatar_mime VARCHAR(30),
  password_hash VARCHAR(200) NOT NULL,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  email_token VARCHAR(64),
  email_token_expires TIMESTAMP,
  reset_token VARCHAR(64),
  reset_token_expires TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Staff
CREATE TABLE staff (
  id SERIAL PRIMARY KEY,
  knust_staff_id VARCHAR(30) UNIQUE NOT NULL,
  full_name VARCHAR(200) NOT NULL,
  email VARCHAR(200) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('librarian', 'admin')),
  branch_id INTEGER REFERENCES branch_libraries(id),
  avatar_data BYTEA,
  avatar_mime VARCHAR(30),
  password_hash VARCHAR(200) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Books
CREATE TABLE books (
  id SERIAL PRIMARY KEY,
  isbn VARCHAR(20) UNIQUE NOT NULL,
  title VARCHAR(300) NOT NULL,
  author VARCHAR(200) NOT NULL,
  publisher VARCHAR(200),
  genre VARCHAR(100),
  copies_total INTEGER NOT NULL DEFAULT 1 CHECK (copies_total >= 0),
  copies_available INTEGER NOT NULL DEFAULT 1 CHECK (copies_available >= 0),
  shelf_location VARCHAR(50),
  cover_url VARCHAR(500),
  branch_id INTEGER REFERENCES branch_libraries(id)
);
CREATE INDEX idx_books_title ON books (title);
CREATE INDEX idx_books_author ON books (author);

-- Loan transactions
CREATE TABLE loan_transactions (
  id SERIAL PRIMARY KEY,
  book_isbn VARCHAR(20) NOT NULL REFERENCES books(isbn),
  member_id INTEGER NOT NULL REFERENCES members(id),
  staff_id INTEGER REFERENCES staff(id),
  checkout_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  return_date DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'returned', 'overdue'))
);

-- Reservations
CREATE TABLE reservations (
  id SERIAL PRIMARY KEY,
  book_isbn VARCHAR(20) NOT NULL REFERENCES books(isbn),
  member_id INTEGER NOT NULL REFERENCES members(id),
  request_date TIMESTAMP NOT NULL DEFAULT NOW(),
  expiry_date TIMESTAMP NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'fulfilled', 'expired'))
);

-- Fine accounts
CREATE TABLE fine_accounts (
  id SERIAL PRIMARY KEY,
  member_id INTEGER UNIQUE NOT NULL REFERENCES members(id),
  outstanding_balance NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (outstanding_balance >= 0),
  last_updated TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Fine transactions
CREATE TABLE fine_transactions (
  id SERIAL PRIMARY KEY,
  fine_account_id INTEGER NOT NULL REFERENCES fine_accounts(id),
  loan_transaction_id INTEGER NOT NULL REFERENCES loan_transactions(id),
  days_overdue INTEGER NOT NULL,
  rate_per_day NUMERIC(6,2) NOT NULL DEFAULT 1.00,
  amount NUMERIC(10,2) NOT NULL,
  settled BOOLEAN NOT NULL DEFAULT FALSE,
  settlement_date DATE
);

-- Audit log
CREATE TABLE audit_log (
  id SERIAL PRIMARY KEY,
  actor_type VARCHAR(10) NOT NULL CHECK (actor_type IN ('staff', 'patron', 'system')),
  actor_id INTEGER,
  actor_name VARCHAR(200),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id VARCHAR(100),
  details JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_audit_log_created ON audit_log (created_at DESC);
CREATE INDEX idx_audit_log_action ON audit_log (action);
