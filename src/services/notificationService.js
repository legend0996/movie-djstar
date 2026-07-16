const db = require('../config/database');

const notificationService = {
  async create(userId, type, title, message, data = null) {
    const [result] = await db.execute(
      `INSERT INTO notifications (user_id, type, title, message, data)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, type, title, message, data ? JSON.stringify(data) : null]
    );
    return result.insertId;
  },

  async createSystemNotification(type, title, message, data = null) {
    const [result] = await db.execute(
      `INSERT INTO notifications (user_id, type, title, message, data)
       VALUES (NULL, ?, ?, ?, ?)`,
      [type, title, message, data ? JSON.stringify(data) : null]
    );
    return result.insertId;
  },

  async getUserNotifications(userId, { page = 1, limit = 20, unreadOnly = false } = {}) {
    const offset = (page - 1) * limit;
    let where = 'WHERE (user_id = ? OR user_id IS NULL)';
    const params = [userId];

    if (unreadOnly) {
      where += ' AND is_read = 0';
    }

    const [rows] = await db.execute(
      `SELECT * FROM notifications ${where}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [countResult] = await db.execute(
      `SELECT COUNT(*) as total FROM notifications ${where}`,
      params
    );

    const [unreadCount] = await db.execute(
      `SELECT COUNT(*) as count FROM notifications WHERE (user_id = ? OR user_id IS NULL) AND is_read = 0`,
      [userId]
    );

    return { rows, total: countResult[0].total, unread: unreadCount[0].count };
  },

  async markAsRead(notificationId, userId) {
    const [result] = await db.execute(
      `UPDATE notifications SET is_read = 1, read_at = NOW()
       WHERE id = ? AND (user_id = ? OR user_id IS NULL)`,
      [notificationId, userId]
    );
    return result.affectedRows > 0;
  },

  async markAllAsRead(userId) {
    const [result] = await db.execute(
      `UPDATE notifications SET is_read = 1, read_at = NOW()
       WHERE (user_id = ? OR user_id IS NULL) AND is_read = 0`,
      [userId]
    );
    return result.affectedRows;
  },

  async getUnreadCount(userId) {
    const [rows] = await db.execute(
      `SELECT COUNT(*) as count FROM notifications
       WHERE (user_id = ? OR user_id IS NULL) AND is_read = 0`,
      [userId]
    );
    return rows[0].count;
  },
};

module.exports = notificationService;
