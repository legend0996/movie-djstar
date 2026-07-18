const prisma = require('../config/database');

const orderRepository = {
  async create({ userId, orderNumber, totalAmount, status, paymentStatus, notes }) {
    const order = await prisma.order.create({
      data: {
        userId,
        orderNumber,
        totalAmount,
        status: status || 'pending',
        paymentStatus: paymentStatus || 'pending',
        notes: notes || null
      }
    });
    return order.id;
  },

  async addItem(orderId, movieId, itemPrice) {
    const item = await prisma.orderItem.create({
      data: { orderId, movieId, itemPrice }
    });
    return item.id;
  },

  async findById(id) {
    return prisma.order.findUnique({
      where: { id },
      include: { user: true }
    });
  },

  async findByOrderNumber(orderNumber) {
    return prisma.order.findUnique({
      where: { orderNumber },
      include: { user: true }
    });
  },

  async findByUser(userId, { page = 1, limit = 20 } = {}) {
    const where = { userId };

    const [rows, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: {
            include: { movie: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.order.count({ where })
    ]);

    return { rows, total };
  },

  async updateStatus(id, { status, paymentStatus, paidAt }) {
    const data = {};
    if (status !== undefined) data.status = status;
    if (paymentStatus !== undefined) data.paymentStatus = paymentStatus;
    if (paidAt !== undefined) data.paidAt = paidAt;

    if (Object.keys(data).length === 0) return false;
    await prisma.order.update({ where: { id }, data });
    return true;
  },

  async getItems(orderId) {
    return prisma.orderItem.findMany({
      where: { orderId },
      include: { movie: true }
    });
  },

  async getTotalRevenue() {
    const result = await prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: { paymentStatus: 'paid' }
    });
    return result._sum.totalAmount || 0;
  },

  async getRevenueForPeriod(startDate, endDate) {
    const result = await prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: {
        paymentStatus: 'paid',
        paidAt: { gte: startDate, lt: endDate }
      }
    });
    return result._sum.totalAmount || 0;
  },

  async getSalesCountForPeriod(startDate, endDate) {
    return prisma.order.count({
      where: {
        paymentStatus: 'paid',
        paidAt: { gte: startDate, lt: endDate }
      }
    });
  },

  async getAllForPeriod(startDate, endDate, { page = 1, limit = 50 } = {}) {
    const where = {
      createdAt: { gte: startDate, lt: endDate }
    };

    const [rows, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: { user: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.order.count({ where })
    ]);

    return { rows, total };
  },

  async countAll() {
    return prisma.order.count();
  }
};

module.exports = orderRepository;
