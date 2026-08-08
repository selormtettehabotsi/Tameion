const pool = require('../db/pool');
const logger = require('./logger');

async function audit({ actorType, actorId, actorName, action, entityType, entityId, details, ip }) {
  try {
    await pool.query(
      `INSERT INTO audit_log (actor_type, actor_id, actor_name, action, entity_type, entity_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [actorType, actorId || null, actorName || null, action, entityType || null, entityId || null, details ? JSON.stringify(details) : null, ip || null]
    );
  } catch (err) {
    logger.error({ err, action }, 'Audit log write failed');
  }
}

function auditFromReq(req, action, entityType, entityId, details) {
  const user = req.session?.user;
  audit({
    actorType: user?.isStaff ? 'staff' : 'patron',
    actorId: user?.id,
    actorName: user?.name,
    action,
    entityType,
    entityId: entityId != null ? String(entityId) : null,
    details,
    ip: req.ip,
  });
}

module.exports = { audit, auditFromReq };
