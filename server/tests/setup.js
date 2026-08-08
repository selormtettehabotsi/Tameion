const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

module.exports = async function globalSetup() {
  if (!process.env.DATABASE_URL) {
    console.warn('[test:setup] DATABASE_URL not set — skipping DB schema setup');
    return;
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const schema = fs.readFileSync(
      path.join(__dirname, '../src/db/schema.sql'),
      'utf8'
    );
    await pool.query(schema);
  } finally {
    await pool.end();
  }
};
