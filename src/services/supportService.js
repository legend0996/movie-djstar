const db = require('../config/database');
const emailService = require('./emailService');
const { generateTicketNumber, sanitizeString } = require('../utils/helpers');
const { logActivity } = require('../middleware/activityLogger');
const { NotFoundError } = require('../utils/errors');
const logger = require('../utils/logger');

const supportService = {
  async createTicket(userId, { subject, message, priority }) {
    const ticketNumber = generateTicketNumber();

    const [result] = await db.execute(
      `INSERT INTO support_tickets (user_id, ticket_number, subject, message, priority, status)
       VALUES (?, ?, ?, ?, ?, 'open')`,
      [userId, ticketNumber, sanitizeString(subject), sanitizeString(message), priority || 'medium']
    );

    await logActivity(userId, 'support_ticket_created', 'support_ticket', result.insertId, { ticketNumber, subject });

    const user = await require('../repositories/userRepository').findById(userId);
    if (user) {
      try {
        await emailService.sendSupportNotification(user.email, ticketNumber, subject);
      } catch (err) {
        logger.error('Failed to send support notification', { error: err.message });
      }
    }

    return { id: result.insertId, ticketNumber, subject, status: 'open' };
  },

  async getTicket(ticketId, userId = null) {
    let query = `SELECT st.*, u.username, u.email
                 FROM support_tickets st
                 JOIN users u ON st.user_id = u.id
                 WHERE st.id = ?`;
    const params = [ticketId];

    if (userId) {
      query += ' AND st.user_id = ?';
      params.push(userId);
    }

    const [rows] = await db.execute(query, params);
    const ticket = rows[0];

    if (!ticket) {
      throw new NotFoundError('Support ticket not found');
    }

    const [replies] = await db.execute(
      `SELECT str.*, u.username
       FROM support_ticket_replies str
       JOIN users u ON str.user_id = u.id
       WHERE str.ticket_id = ?
       ORDER BY str.created_at ASC`,
      [ticketId]
    );

    ticket.replies = replies;
    return ticket;
  },

  async getUserTickets(userId, { page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    const [rows] = await db.execute(
      `SELECT * FROM support_tickets WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );

    const [countResult] = await db.execute(
      `SELECT COUNT(*) as total FROM support_tickets WHERE user_id = ?`,
      [userId]
    );

    return { rows, total: countResult[0].total };
  },

  async addReply(ticketId, userId, message, isStaff = false) {
    const [ticket] = await db.execute(
      `SELECT * FROM support_tickets WHERE id = ?`,
      [ticketId]
    );

    if (!ticket.length) {
      throw new NotFoundError('Support ticket not found');
    }

    const [result] = await db.execute(
      `INSERT INTO support_ticket_replies (ticket_id, user_id, message, is_staff)
       VALUES (?, ?, ?, ?)`,
      [ticketId, userId, sanitizeString(message), isStaff ? 1 : 0]
    );

    if (isStaff) {
      await db.execute(
        `UPDATE support_tickets SET status = 'waiting_on_customer', updated_at = NOW() WHERE id = ?`,
        [ticketId]
      );
    } else {
      await db.execute(
        `UPDATE support_tickets SET status = 'in_progress', updated_at = NOW() WHERE id = ?`,
        [ticketId]
      );
    }

    await logActivity(userId, 'support_reply', 'support_ticket', ticketId, { ticketId });

    return { id: result.insertId, message, createdAt: new Date() };
  },

  async updateTicketStatus(ticketId, status, userId) {
    const [ticket] = await db.execute(`SELECT * FROM support_tickets WHERE id = ?`, [ticketId]);
    if (!ticket.length) {
      throw new NotFoundError('Support ticket not found');
    }

    const updates = { status };
    if (status === 'resolved') updates.resolved_at = new Date();
    if (status === 'closed') updates.closed_at = new Date();

    const setClauses = Object.keys(updates).map(k => `${k} = ?`).join(', ');
    const values = [...Object.values(updates), ticketId];

    await db.execute(
      `UPDATE support_tickets SET ${setClauses}, updated_at = NOW() WHERE id = ?`,
      values
    );

    await logActivity(userId, 'support_status_change', 'support_ticket', ticketId, { newStatus: status });

    return { message: `Ticket status updated to ${status}` };
  },
};

module.exports = supportService;
