const db = require('../config/database');

const orderRepository = {
  async create({ userId, orderNumber, totalAmount, status, paymentStatus, notes }) {
    const [result] = await db.execute(
      `INSERT INTO orders (user_id, order_number, total_amount, status, payment_status, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, orderNumber, totalAmount, status || 'pending', paymentStatus || 'pending', notes || null]
    );
    return result.insertId;
  },

  async addItem(orderId, movieId, itemPrice) {
    const [result] = await db.execute(
      `INSERT INTO order_items (order_id, movie_id, item_price) VALUES (?, ?, ?)`,
      [orderId, movieId, itemPrice]
    );
    return result.insertId;
  },

  async findById(id) {
    const [rows] = await db.execute(
      `SELECT o.*, u.username, u.email
       FROM orders o
       JOIN users u ON o.user_id = u.id
       WHERE o.id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  async findByOrderNumber(orderNumber) {
    const [rows] = await db.execute(
      `SELECT o.*, u.username, u.email
       FROM orders o
       JOIN users u ON o.user_id = u.id
       WHERE o.order_number = ?`,
      [orderNumber]
    );
    return rows[0] || null;
  },

  async findByUser(userId, { page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    const [rows] = await db.execute(
      `SELECT o.*, GROUP_CONCAT(CONCAT(m.title, '::', m.slug, '::', oi.item_price) SEPARATOR '||') as items
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       LEFT JOIN movies m ON oi.movie_id = m.id
       WHERE o.user_id = ?
       GROUP BY o.id
       ORDER BY o.created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );

    const [countResult] = await db.execute(
      `SELECT COUNT(*) as total FROM orders WHERE user_id = ?`,
      [userId]
    );

    const parsedRows = rows.map(row => {
      let items = [];
      if (row.items) {
        items = row.items.split('||').map(item => {
          const [title, slug, price] = item.split('::');
          return { title, slug, price: parseFloat(price) };
        });
      }
      return { ...row, items };
    });

    return { rows: parsedRows, total: countResult[0].total };
  },

  async updateStatus(id, { status, paymentStatus, paidAt }) {
    const updates = [];
    const values = [];

    if (status) { updates.push('status = ?'); values.push(status); }
    if (paymentStatus) { updates.push('payment_status = ?'); values.push(paymentStatus); }
    if (paidAt) { updates.push('paid_at = ?'); values.push(paidAt); }

    if (updates.length === 0) return false;
    values.push(id);

    const [result] = await db.execute(
      `UPDATE orders SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    return result.affectedRows > 0;
  },

  async getItems(orderId) {
    const [rows] = await db.execute(
      `SELECT oi.*, m.title, m.slug, m.poster_url
       FROM order_items oi
       JOIN movies m ON oi.movie_id = m.id
       WHERE oi.order_id = ?`,
      [orderId]
    );
    return rows;
  },

  async getTotalRevenue() {
    const [rows] = await db.execute(
      `SELECT COALESCE(SUM(total_amount), 0) as total
       FROM orders WHERE payment_status = 'paid'`
    );
    return rows[0].total;
  },

  async getRevenueForPeriod(startDate, endDate) {
    const [rows] = await db.execute(
      `SELECT COALESCE(SUM(total_amount), 0) as total
       FROM orders
       WHERE payment_status = 'paid' AND paid_at >= ? AND paid_at < ?`,
      [startDate, endDate]
    );
    return rows[0].total;
  },

  async getSalesCountForPeriod(startDate, endDate) {
    const [rows] = await db.execute(
      `SELECT COUNT(*) as count
       FROM orders
       WHERE payment_status = 'paid' AND paid_at >= ? AND paid_at < ?`,
      [startDate, endDate]
    );
    return rows[0].count;
  },

  async getAllForPeriod(startDate, endDate, { page = 1, limit = 50 } = {}) {
    const offset = (page - 1) * limit;
    const [rows] = await db.execute(
      `SELECT o.*, u.username, u.email
       FROM orders o
       JOIN users u ON o.user_id = u.id
       WHERE o.created_at >= ? AND o.created_at < ?
       ORDER BY o.created_at DESC
       LIMIT ? OFFSET ?`,
      [startDate, endDate, limit, offset]
    );

    const [countResult] = await db.execute(
      `SELECT COUNT(*) as total FROM orders WHERE created_at >= ? AND created_at < ?`,
      [startDate, endDate]
    );

    return { rows, total: countResult[0].total };
  },

  async countAll() {
    const [rows] = await db.execute(`SELECT COUNT(*) as count FROM orders`);
    return rows[0].count;
  },
};

module.exports = orderRepository;
