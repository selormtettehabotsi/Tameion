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

// Run once on startup, then every 15 minutes
markOverdueLoans();
expireReservations();
setInterval(markOverdueLoans, 15 * 60 * 1000);
setInterval(expireReservations, 15 * 60 * 1000);
