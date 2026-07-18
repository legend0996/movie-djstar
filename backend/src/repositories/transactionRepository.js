const prisma = require('../config/database');

const transactionRepository = {
  async create(data) {
    const txn = await prisma.transaction.create({
      data: {
        userId: data.userId,
        orderId: data.orderId || null,
        transactionReference: data.transactionReference || null,
        merchantRequestId: data.merchantRequestId || null,
        checkoutRequestId: data.checkoutRequestId || null,
        phoneNumber: data.phoneNumber || null,
        amount: data.amount,
        currency: data.currency || 'KES',
        status: data.status || 'pending',
        paymentMethod: data.paymentMethod || 'mpesa_buy_goods',
        paymentProvider: data.paymentProvider || 'safaricom',
        metadata: data.metadata || undefined,
      },
    });
    return txn.id;
  },

  async findById(id) {
    return prisma.transaction.findUnique({
      where: { id },
      include: { user: true },
    });
  },

  async findByReference(reference) {
    return prisma.transaction.findUnique({
      where: { transactionReference: reference },
      include: { user: true },
    });
  },

  async findByCheckoutRequestId(checkoutRequestId) {
    return prisma.transaction.findFirst({
      where: { checkoutRequestId },
      include: { user: true },
    });
  },

  async findByMerchantRequestId(merchantRequestId) {
    return prisma.transaction.findFirst({
      where: { merchantRequestId },
      include: { user: true },
    });
  },

  async update(id, data) {
    const allowed = [
      'status', 'resultCode', 'resultDescription', 'mpesaReceipt',
      'transactionDate', 'callbackReceivedAt', 'callbackData',
      'merchantRequestId', 'checkoutRequestId', 'transactionReference',
      'orderId', 'phoneNumber',
    ];
    const updateData = {};
    for (const [key, value] of Object.entries(data)) {
      if (allowed.includes(key) && value !== undefined) {
        updateData[key] = value;
      }
    }
    if (Object.keys(updateData).length === 0) {return false;}
    await prisma.transaction.update({ where: { id }, data: updateData });
    return true;
  },

  async findByUser(userId, { page = 1, limit = 20 } = {}) {
    const where = { userId };

    const [rows, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.transaction.count({ where }),
    ]);

    return { rows, total };
  },

  async getStats() {
    const [total, successful, failed, pending, revenue] = await Promise.all([
      prisma.transaction.count(),
      prisma.transaction.count({ where: { status: 'successful' } }),
      prisma.transaction.count({ where: { status: 'failed' } }),
      prisma.transaction.count({ where: { status: 'pending' } }),
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { status: 'successful' },
      }),
    ]);

    return {
      total_transactions: total,
      successful_count: successful,
      failed_count: failed,
      pending_count: pending,
      total_revenue: revenue._sum.amount || 0,
    };
  },

  async getUserTransactionStats(userId) {
    const [total, successful, failed, spent] = await Promise.all([
      prisma.transaction.count({ where: { userId } }),
      prisma.transaction.count({ where: { userId, status: 'successful' } }),
      prisma.transaction.count({ where: { userId, status: 'failed' } }),
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { userId, status: 'successful' },
      }),
    ]);

    return {
      total,
      successful,
      failed,
      total_spent: spent._sum.amount || 0,
    };
  },
};

module.exports = transactionRepository;
