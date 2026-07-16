const db = require('../config/database');

const userRepository = {
  async findById(id) {
    const [rows] = await db.execute(
      `SELECT u.*, r.name as role_name, r.slug as role_slug
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = ? AND u.deleted_at IS NULL`,
      [id]
    );
    return rows[0] || null;
  },

  async findByUsername(username) {
    const [rows] = await db.execute(
      `SELECT u.*, r.name as role_name, r.slug as role_slug
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.username = ? AND u.deleted_at IS NULL`,
      [username]
    );
    return rows[0] || null;
  },

  async findByEmail(email) {
    const [rows] = await db.execute(
      `SELECT u.*, r.name as role_name, r.slug as role_slug
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.email = ? AND u.deleted_at IS NULL`,
      [email]
    );
    return rows[0] || null;
  },

  async findByPhone(phone) {
    const [rows] = await db.execute(
      `SELECT u.*, r.name as role_name, r.slug as role_slug
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.phone = ? AND u.deleted_at IS NULL`,
      [phone]
    );
    return rows[0] || null;
  },

  async create({ username, email, phone, passwordHash, firstName, lastName, roleId }) {
    const [result] = await db.execute(
      `INSERT INTO users (role_id, username, email, phone, password_hash, first_name, last_name, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'unverified')`,
      [roleId, username, email, phone || null, passwordHash, firstName || null, lastName || null]
    );
    return result.insertId;
  },

  async update(id, fields) {
    const allowed = ['first_name', 'last_name', 'phone', 'avatar_url', 'status', 'email_verified_at', 'last_login_at', 'last_login_ip', 'login_attempts', 'locked_until', 'password_hash', 'password_changed_at', 'email'];
    const updates = [];
    const values = [];

    for (const [key, value] of Object.entries(fields)) {
      if (allowed.includes(key) && value !== undefined) {
        updates.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (updates.length === 0) return false;

    values.push(id);
    const [result] = await db.execute(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    return result.affectedRows > 0;
  },

  async softDelete(id) {
    const [result] = await db.execute(
      `UPDATE users SET deleted_at = NOW(), status = 'deleted' WHERE id = ?`,
      [id]
    );
    return result.affectedRows > 0;
  },

  async incrementLoginAttempts(id) {
    await db.execute(
      `UPDATE users SET login_attempts = login_attempts + 1 WHERE id = ?`,
      [id]
    );
  },

  async resetLoginAttempts(id) {
    await db.execute(
      `UPDATE users SET login_attempts = 0, locked_until = NULL WHERE id = ?`,
      [id]
    );
  },

  async lockAccount(id, until) {
    await db.execute(
      `UPDATE users SET locked_until = ? WHERE id = ?`,
      [until, id]
    );
  },

  async countByStatus(status) {
    const [rows] = await db.execute(
      `SELECT COUNT(*) as count FROM users WHERE status = ? AND deleted_at IS NULL`,
      [status]
    );
    return rows[0].count;
  },

  async countAll() {
    const [rows] = await db.execute(
      `SELECT COUNT(*) as count FROM users WHERE deleted_at IS NULL`
    );
    return rows[0].count;
  },

  async findAll(page = 1, limit = 20, filters = {}) {
    const offset = (page - 1) * limit;
    let where = 'WHERE u.deleted_at IS NULL';
    const params = [];

    if (filters.status) {
      where += ' AND u.status = ?';
      params.push(filters.status);
    }
    if (filters.role) {
      where += ' AND r.slug = ?';
      params.push(filters.role);
    }
    if (filters.search) {
      where += ' AND (u.username LIKE ? OR u.email LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?)';
      const search = `%${filters.search}%`;
      params.push(search, search, search, search);
    }

    const [rows] = await db.execute(
      `SELECT u.id, u.username, u.email, u.phone, u.first_name, u.last_name,
              u.status, u.last_login_at, u.created_at,
              r.name as role_name, r.slug as role_slug
       FROM users u
       JOIN roles r ON u.role_id = r.id
       ${where}
       ORDER BY u.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [countResult] = await db.execute(
      `SELECT COUNT(*) as total FROM users u JOIN roles r ON u.role_id = r.id ${where}`,
      params
    );

    return { rows, total: countResult[0].total };
  },

  async findRecent(days = 7) {
    const [rows] = await db.execute(
      `SELECT COUNT(*) as count FROM users
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY) AND deleted_at IS NULL`,
      [days]
    );
    return rows[0].count;
  },
};

module.exports = userRepository;
