const prisma = require('../config/database');

const supportRepository = {
  async createTicket(userId, { ticketNumber, subject, message, priority }) {
    const ticket = await prisma.supportTicket.create({
      data: {
        userId,
        ticketNumber,
        subject,
        message,
        priority: priority || 'medium',
      },
    });
    return ticket.id;
  },

  async findTicketById(ticketId) {
    return prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });
  },

  async findTicketByUser(ticketId, userId) {
    return prisma.supportTicket.findFirst({
      where: { id: ticketId, userId },
    });
  },

  async getTicketWithReplies(ticketId, userId) {
    const where = userId ? { id: ticketId, userId } : { id: ticketId };
    return prisma.supportTicket.findFirst({
      where,
      include: {
        user: true,
        replies: {
          include: { user: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  },

  async getUserTickets(userId, { page = 1, limit = 20 } = {}) {
    const where = { userId };

    const [rows, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.supportTicket.count({ where }),
    ]);

    return { rows, total };
  },

  async addReply(ticketId, userId, message, isStaff = false) {
    const reply = await prisma.supportTicketReply.create({
      data: { ticketId, userId, message, isStaff },
    });
    return reply.id;
  },

  async updateTicketStatus(ticketId, { status, resolvedAt, closedAt }) {
    const data = {};
    if (status !== undefined) {data.status = status;}
    if (resolvedAt !== undefined) {data.resolvedAt = resolvedAt;}
    if (closedAt !== undefined) {data.closedAt = closedAt;}

    await prisma.supportTicket.update({
      where: { id: ticketId },
      data,
    });
    return true;
  },

  async findAllTickets({ page = 1, limit = 20, status, priority } = {}) {
    const where = {};
    if (status) {where.status = status;}
    if (priority) {where.priority = priority;}

    const [rows, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        include: { user: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.supportTicket.count({ where }),
    ]);

    return { rows, total };
  },
};

module.exports = supportRepository;
