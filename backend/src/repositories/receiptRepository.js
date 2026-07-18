const prisma = require('../config/database');

const receiptRepository = {
  async create({ orderId, userId, receiptNumber, receiptData }) {
    const receipt = await prisma.receipt.create({
      data: { orderId, userId, receiptNumber, receiptData }
    });
    return receipt;
  },

  async findById(id) {
    return prisma.receipt.findUnique({
      where: { id },
      include: { order: true }
    });
  },

  async findByUser(userId, { page = 1, limit = 20 } = {}) {
    const where = { userId };

    const [rows, total] = await Promise.all([
      prisma.receipt.findMany({
        where,
        include: { order: { select: { orderNumber: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.receipt.count({ where })
    ]);

    return { rows, total };
  },

  async findByUserAndId(id, userId) {
    return prisma.receipt.findFirst({
      where: { id, userId },
      include: { order: { select: { orderNumber: true } } }
    });
  },
};

module.exports = receiptRepository;
