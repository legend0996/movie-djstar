const logger = require('../utils/logger');
const db = require('../config/database');

async function logActivity(userId, action, entityType = null, entityId = null, details = null, req = null) {
  try {
    await db.execute(
      `INSERT INTO user_activity_log (user_id, action, entity_type, entity_id, ip_address, user_agent, details)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        action,
        entityType,
        entityId,
        req ? req.ip : null,
        req ? req.headers['user-agent'] : null,
        details ? JSON.stringify(details) : null,
      ]
    );
  } catch (err) {
    logger.error('Failed to log activity', { error: err.message, userId, action });
  }
}

function activityMiddleware(action, entityType = null) {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = function (body) {
      if (res.statusCode < 400 && req.user) {
        const entityId = req.params.id || req.body?.id || body?.data?.id || null;
        logActivity(req.user.id, action, entityType, entityId, { body: req.body }, req);
      }
      return originalJson(body);
    };
    next();
  };
}

module.exports = { logActivity, activityMiddleware };
