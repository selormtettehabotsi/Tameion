exports.up = (pgm) => {
  // Session store (required by connect-pg-simple)
  pgm.createTable('session', {
    sid: { type: 'varchar', notNull: true, primaryKey: true },
    sess: { type: 'json', notNull: true },
    expire: { type: 'timestamp(6)', notNull: true },
  });
  pgm.createIndex('session', 'expire', { name: 'IDX_session_expire' });

  // Branch libraries
  pgm.createTable('branch_libraries', {
    id: 'id',
    branch_name: { type: 'varchar(200)', notNull: true },
    college: { type: 'varchar(200)', notNull: true },
    location: { type: 'varchar(300)' },
  });

  // Members (patrons)
  pgm.createTable('members', {
    id: 'id',
    knust_id: { type: 'varchar(30)', notNull: true, unique: true },
    full_name: { type: 'varchar(200)', notNull: true },
    email: { type: 'varchar(200)', notNull: true },
    phone: { type: 'varchar(20)' },
    user_type: {
      type: 'varchar(20)', notNull: true,
      check: "user_type IN ('student', 'faculty', 'postgraduate')",
    },
    programme: { type: 'varchar(200)' },
    account_status: { type: 'varchar(20)', notNull: true, default: "'active'" },
    password_hash: { type: 'varchar(200)', notNull: true },
    email_verified: { type: 'boolean', notNull: true, default: false },
    email_token: { type: 'varchar(64)' },
    email_token_expires: { type: 'timestamp' },
    reset_token: { type: 'varchar(64)' },
    reset_token_expires: { type: 'timestamp' },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('NOW()') },
  });

  // Staff
  pgm.createTable('staff', {
    id: 'id',
    knust_staff_id: { type: 'varchar(30)', notNull: true, unique: true },
    full_name: { type: 'varchar(200)', notNull: true },
    email: { type: 'varchar(200)', notNull: true },
    role: {
      type: 'varchar(20)', notNull: true,
      check: "role IN ('librarian', 'admin')",
    },
    branch_id: { type: 'integer', references: 'branch_libraries' },
    password_hash: { type: 'varchar(200)', notNull: true },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('NOW()') },
  });

  // Books
  pgm.createTable('books', {
    id: 'id',
    isbn: { type: 'varchar(20)', notNull: true, unique: true },
    title: { type: 'varchar(300)', notNull: true },
    author: { type: 'varchar(200)', notNull: true },
    publisher: { type: 'varchar(200)' },
    genre: { type: 'varchar(100)' },
    copies_total: { type: 'integer', notNull: true, default: 1, check: 'copies_total >= 0' },
    copies_available: { type: 'integer', notNull: true, default: 1, check: 'copies_available >= 0' },
    shelf_location: { type: 'varchar(50)' },
    branch_id: { type: 'integer', references: 'branch_libraries' },
  });

  // Loan transactions
  pgm.createTable('loan_transactions', {
    id: 'id',
    book_isbn: { type: 'varchar(20)', notNull: true, references: 'books(isbn)' },
    member_id: { type: 'integer', notNull: true, references: 'members' },
    staff_id: { type: 'integer', references: 'staff' },
    checkout_date: { type: 'date', notNull: true, default: pgm.func('CURRENT_DATE') },
    due_date: { type: 'date', notNull: true },
    return_date: { type: 'date' },
    status: {
      type: 'varchar(20)', notNull: true, default: "'active'",
      check: "status IN ('active', 'returned', 'overdue')",
    },
  });

  // Reservations
  pgm.createTable('reservations', {
    id: 'id',
    book_isbn: { type: 'varchar(20)', notNull: true, references: 'books(isbn)' },
    member_id: { type: 'integer', notNull: true, references: 'members' },
    request_date: { type: 'timestamp', notNull: true, default: pgm.func('NOW()') },
    expiry_date: { type: 'timestamp', notNull: true },
    status: {
      type: 'varchar(20)', notNull: true, default: "'pending'",
      check: "status IN ('pending', 'fulfilled', 'expired')",
    },
  });

  // Fine accounts
  pgm.createTable('fine_accounts', {
    id: 'id',
    member_id: { type: 'integer', notNull: true, unique: true, references: 'members' },
    outstanding_balance: { type: 'numeric(10,2)', notNull: true, default: 0, check: 'outstanding_balance >= 0' },
    last_updated: { type: 'timestamp', notNull: true, default: pgm.func('NOW()') },
  });

  // Fine transactions
  pgm.createTable('fine_transactions', {
    id: 'id',
    fine_account_id: { type: 'integer', notNull: true, references: 'fine_accounts' },
    loan_transaction_id: { type: 'integer', notNull: true, references: 'loan_transactions' },
    days_overdue: { type: 'integer', notNull: true },
    rate_per_day: { type: 'numeric(6,2)', notNull: true, default: 1.00 },
    amount: { type: 'numeric(10,2)', notNull: true },
    settled: { type: 'boolean', notNull: true, default: false },
    settlement_date: { type: 'date' },
  });
};

exports.down = (pgm) => {
  pgm.dropTable('fine_transactions');
  pgm.dropTable('fine_accounts');
  pgm.dropTable('reservations');
  pgm.dropTable('loan_transactions');
  pgm.dropTable('books');
  pgm.dropTable('staff');
  pgm.dropTable('members');
  pgm.dropTable('branch_libraries');
  pgm.dropTable('session');
};
