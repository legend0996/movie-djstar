const db = require('../config/database');

const libraryRepository = {
  async addToLibrary(userId, movieId, orderId, purchasePrice) {
    const [result] = await db.execute(
      `INSERT INTO user_library (user_id, movie_id, order_id, purchase_price)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE is_available = 1, order_id = VALUES(order_id)`,
      [userId, movieId, orderId, purchasePrice]
    );
    return result.insertId || result.affectedRows > 0;
  },

  async removeFromLibrary(userId, movieId) {
    const [result] = await db.execute(
      `UPDATE user_library SET is_available = 0 WHERE user_id = ? AND movie_id = ?`,
      [userId, movieId]
    );
    return result.affectedRows > 0;
  },

  async isOwned(userId, movieId) {
    const [rows] = await db.execute(
      `SELECT id FROM user_library WHERE user_id = ? AND movie_id = ? AND is_available = 1`,
      [userId, movieId]
    );
    return rows.length > 0;
  },

  async getUserLibrary(userId, { page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    const [rows] = await db.execute(
      `SELECT l.id, l.purchase_price, l.created_at as purchased_at,
              m.id as movie_id, m.title, m.slug, m.description, m.short_description,
              m.duration, m.language, m.quality, m.poster_url, m.cover_url, m.thumbnail_url,
              m.movie_url, m.movie_size, m.movie_format, m.price,
              c.name as category_name, c.slug as category_slug,
              pp.position_seconds as playback_position,
              pp.duration_seconds as playback_duration,
              pp.completed as playback_completed,
              pp.last_watched_at
       FROM user_library l
       JOIN movies m ON l.movie_id = m.id
       LEFT JOIN categories c ON m.category_id = c.id
       LEFT JOIN playback_progress pp ON pp.user_id = l.user_id AND pp.movie_id = l.movie_id
       WHERE l.user_id = ? AND l.is_available = 1 AND m.deleted_at IS NULL
       ORDER BY l.created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );

    const [countResult] = await db.execute(
      `SELECT COUNT(*) as total FROM user_library l
       JOIN movies m ON l.movie_id = m.id
       WHERE l.user_id = ? AND l.is_available = 1 AND m.deleted_at IS NULL`,
      [userId]
    );

    return { rows, total: countResult[0].total };
  },

  async getLibraryCount(userId) {
    const [rows] = await db.execute(
      `SELECT COUNT(*) as count FROM user_library WHERE user_id = ? AND is_available = 1`,
      [userId]
    );
    return rows[0].count;
  },

  async savePlaybackProgress(userId, movieId, positionSeconds, durationSeconds, completed = false) {
    await db.execute(
      `INSERT INTO playback_progress (user_id, movie_id, position_seconds, duration_seconds, completed, last_watched_at)
       VALUES (?, ?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE
         position_seconds = VALUES(position_seconds),
         duration_seconds = VALUES(duration_seconds),
         completed = VALUES(completed),
         last_watched_at = NOW()`,
      [userId, movieId, positionSeconds, durationSeconds, completed ? 1 : 0]
    );
  },

  async getPlaybackProgress(userId, movieId) {
    const [rows] = await db.execute(
      `SELECT * FROM playback_progress WHERE user_id = ? AND movie_id = ?`,
      [userId, movieId]
    );
    return rows[0] || null;
  },

  async getContinueWatching(userId, limit = 10) {
    const [rows] = await db.execute(
      `SELECT pp.*, m.title, m.slug, m.poster_url, m.thumbnail_url, m.duration,
              c.name as category_name
       FROM playback_progress pp
       JOIN movies m ON pp.movie_id = m.id
       LEFT JOIN categories c ON m.category_id = c.id
       JOIN user_library l ON l.user_id = pp.user_id AND l.movie_id = pp.movie_id AND l.is_available = 1
       WHERE pp.user_id = ? AND pp.completed = 0
       ORDER BY pp.last_watched_at DESC
       LIMIT ?`,
      [userId, limit]
    );
    return rows;
  },

  async logDownload(userId, movieId, ipAddress, userAgent) {
    const [result] = await db.execute(
      `INSERT INTO download_log (user_id, movie_id, ip_address, user_agent)
       VALUES (?, ?, ?, ?)`,
      [userId, movieId, ipAddress, userAgent]
    );
    return result.insertId;
  },

  async logStream(userId, movieId, ipAddress, userAgent) {
    const [result] = await db.execute(
      `INSERT INTO stream_log (user_id, movie_id, ip_address, user_agent)
       VALUES (?, ?, ?, ?)`,
      [userId, movieId, ipAddress, userAgent]
    );
    return result.insertId;
  },

  async getDownloadHistory(userId, { page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    const [rows] = await db.execute(
      `SELECT dl.*, m.title, m.slug
       FROM download_log dl
       JOIN movies m ON dl.movie_id = m.id
       WHERE dl.user_id = ?
       ORDER BY dl.created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );

    const [countResult] = await db.execute(
      `SELECT COUNT(*) as total FROM download_log WHERE user_id = ?`,
      [userId]
    );

    return { rows, total: countResult[0].total };
  },

  async getStreamHistory(userId, { page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    const [rows] = await db.execute(
      `SELECT sl.*, m.title, m.slug
       FROM stream_log sl
       JOIN movies m ON sl.movie_id = m.id
       WHERE sl.user_id = ?
       ORDER BY sl.started_at DESC
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );

    const [countResult] = await db.execute(
      `SELECT COUNT(*) as total FROM stream_log WHERE user_id = ?`,
      [userId]
    );

    return { rows, total: countResult[0].total };
  },
};

module.exports = libraryRepository;
