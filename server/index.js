require('dotenv').config();

const pool = require('./src/db/pool');
const logger = require('./src/lib/logger');
const { createApp } = require('./src/app');

const app = createApp();
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  logger.info({ port: PORT }, 'Tameion server listening');
});

// ── Scheduled Jobs ────────────────────────────────────────

async function markOverdueLoans() {
  try {
    const result = await pool.query(
      `UPDATE loan_transactions SET status = 'overdue'
       WHERE status = 'active' AND due_date < CURRENT_DATE`
    );
    if (result.rowCount > 0) {
      logger.info({ count: result.rowCount }, 'Marked loans as overdue');
    }
  } catch (err) {
    logger.error({ err }, 'Overdue check failed');
  }
}

async function expireReservations() {
  try {
    const result = await pool.query(
      `UPDATE reservations SET status = 'expired'
       WHERE status = 'pending' AND expiry_date < NOW()`
    );
    if (result.rowCount > 0) {
      logger.info({ count: result.rowCount }, 'Expired reservations');
    }
  } catch (err) {
    logger.error({ err }, 'Reservation expiry check failed');
  }
}

// Wait for the database to accept connections before the first sweep, so a
// cold start does not log spurious ECONNREFUSED from the jobs below.
async function waitForDatabase(attempts = 30, delayMs = 1000) {
  for (let i = 1; i <= attempts; i++) {
    try {
      await pool.query('SELECT 1');
      return true;
    } catch (err) {
      if (i === attempts) {
        logger.error({ err }, 'Database unreachable; scheduled jobs disabled');
        return false;
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  return false;
}

// Run once on startup (after the DB is reachable), then every 15 minutes
waitForDatabase().then((ready) => {
  if (!ready) return;
  markOverdueLoans();
  expireReservations();
  setInterval(markOverdueLoans, 15 * 60 * 1000);
  setInterval(expireReservations, 15 * 60 * 1000);
});
