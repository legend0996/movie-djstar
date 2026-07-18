const emailService = require('./emailService');
const userRepository = require('../repositories/userRepository');
const supportRepository = require('../repositories/supportRepository');
const { generateTicketNumber, sanitizeString } = require('../utils/helpers');
const { logActivity } = require('../middleware/activityLogger');
const { NotFoundError } = require('../utils/errors');
const { TICKET_PRIORITY, TICKET_STATUS } = require('../constants');
const logger = require('../utils/logger');

const supportService = {
  async createTicket(userId, { subject, message, priority }) {
    const ticketNumber = generateTicketNumber();
    const ticketId = await supportRepository.createTicket(userId, {
      ticketNumber,
      subject: sanitizeString(subject),
      message: sanitizeString(message),
      priority: priority || TICKET_PRIORITY.MEDIUM,
    });

    await logActivity(userId, 'support_ticket_created', 'support_ticket', ticketId, { ticketNumber, subject });

    const user = await userRepository.findById(userId);
    if (user) {
      try {
        await emailService.sendSupportNotification(user.email, ticketNumber, subject);
      } catch (err) {
        logger.error('Failed to send support notification', { error: err.message });
      }
    }

    return { id: ticketId, ticketNumber, subject, status: TICKET_STATUS.OPEN };
  },

  async getTicket(ticketId, userId = null) {
    const ticket = await supportRepository.getTicketWithReplies(ticketId, userId);
    if (!ticket) {
      throw new NotFoundError('Support ticket not found');
    }
    return ticket;
  },

  async getUserTickets(userId, { page = 1, limit = 20 } = {}) {
    return supportRepository.getUserTickets(userId, { page, limit });
  },

  async addReply(ticketId, userId, message, isStaff = false) {
    const ticket = await supportRepository.findTicketById(ticketId);
    if (!ticket) {
      throw new NotFoundError('Support ticket not found');
    }

    const replyId = await supportRepository.addReply(ticketId, userId, sanitizeString(message), isStaff);

    const newStatus = isStaff ? TICKET_STATUS.WAITING_ON_CUSTOMER : TICKET_STATUS.IN_PROGRESS;
    await supportRepository.updateTicketStatus(ticketId, { status: newStatus });

    await logActivity(userId, 'support_reply', 'support_ticket', ticketId, { ticketId });

    return { id: replyId, message, createdAt: new Date() };
  },

  async updateTicketStatus(ticketId, status, userId) {
    const ticket = await supportRepository.findTicketById(ticketId);
    if (!ticket) {
      throw new NotFoundError('Support ticket not found');
    }

    const updates = { status };
    if (status === TICKET_STATUS.RESOLVED) {updates.resolvedAt = new Date();}
    if (status === TICKET_STATUS.CLOSED) {updates.closedAt = new Date();}

    await supportRepository.updateTicketStatus(ticketId, updates);
    await logActivity(userId, 'support_status_change', 'support_ticket', ticketId, { newStatus: status });

    return { message: `Ticket status updated to ${status}` };
  },
};

module.exports = supportService;
