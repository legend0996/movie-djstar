const db = require('../config/database');

const transactionRepository = {
  async create(data) {
    const [result] = await db.execute(
      `INSERT INTO transactions (user_id, order_id, transaction_reference, merchant_request_id,
        checkout_request_id, phone_number, amount, currency, status, payment_method,
        payment_provider, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.userId,
        data.orderId || null,
        data.transactionReference || null,
        data.merchantRequestId || null,
        data.checkoutRequestId || null,
        data.phoneNumber || null,
        data.amount,
        data.currency || 'KES',
        data.status || 'pending',
        data.paymentMethod || 'mpesa_buy_goods',
        data.paymentProvider || 'safaricom',
        data.metadata ? JSON.stringify(data.metadata) : null,
      ]
    );
    return result.insertId;
  },

  async findById(id) {
    const [rows] = await db.execute(
      `SELECT t.*, u.username, u.email
       FROM transactions t
       JOIN users u ON t.user_id = u.id
       WHERE t.id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  async findByReference(reference) {
    const [rows] = await db.execute(
      `SELECT t.*, u.username, u.email
       FROM transactions t
       JOIN users u ON t.user_id = u.id
       WHERE t.transaction_reference = ?`,
      [reference]
    );
    return rows[0] || null;
  },

  async findByCheckoutRequestId(checkoutRequestId) {
    const [rows] = await db.execute(
      `SELECT t.*, u.username, u.email
       FROM transactions t
       JOIN users u ON t.user_id = u.id
       WHERE t.checkout_request_id = ?`,
      [checkoutRequestId]
    );
    return rows[0] || null;
  },

  async findByMerchantRequestId(merchantRequestId) {
    const [rows] = await db.execute(
      `SELECT t.*, u.username, u.email
       FROM transactions t
       JOIN users u ON t.user_id = u.id
       WHERE t.merchant_request_id = ?`,
      [merchantRequestId]
    );
    return rows[0] || null;
  },

  async update(id, data) {
    const allowed = [
      'status', 'result_code', 'result_description', 'mpesa_receipt',
      'transaction_date', 'callback_received_at', 'callback_data',
      'merchant_request_id', 'checkout_request_id', 'transaction_reference',
      'order_id', 'phone_number',
    ];
    const updates = [];
    const values = [];

    for (const [key, value] of Object.entries(data)) {
      if (allowed.includes(key) && value !== undefined) {
        if (key === 'callback_data' && typeof value === 'object') {
          updates.push(`${key} = ?`);
          values.push(JSON.stringify(value));
        } else {
          updates.push(`${key} = ?`);
          values.push(value);
        }
      }
    }

    if (updates.length === 0) return false;
    values.push(id);

    const [result] = await db.execute(
      `UPDATE transactions SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    return result.affectedRows > 0;
  },

  async findByUser(userId, { page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    const [rows] = await db.execute(
      `SELECT * FROM transactions WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );

    const [countResult] = await db.execute(
      `SELECT COUNT(*) as total FROM transactions WHERE user_id = ?`,
      [userId]
    );

    return { rows, total: countResult[0].total };
  },

  async getStats() {
    const [rows] = await db.execute(
      `SELECT
        COUNT(*) as total_transactions,
        SUM(CASE WHEN status = 'successful' THEN 1 ELSE 0 END) as successful_count,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_count,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
        SUM(CASE WHEN status = 'successful' THEN amount ELSE 0 END) as total_revenue
       FROM transactions`
    );
    return rows[0];
  },

  async getUserTransactionStats(userId) {
    const [rows] = await db.execute(
      `SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'successful' THEN 1 ELSE 0 END) as successful,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
        SUM(CASE WHEN status = 'successful' THEN amount ELSE 0 END) as total_spent
       FROM transactions WHERE user_id = ?`,
      [userId]
    );
    return rows[0];
  },
};

module.exports = transactionRepository;
