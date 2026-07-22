const prisma = require('../config/database');

const revenueRepository = {
  async create(data) {
    const record = await prisma.revenueRecord.create({
      data: {
        orderId: data.orderId,
        transactionId: data.transactionId,
        totalAmount: data.totalAmount,
        developerCommission: data.developerCommission,
        ownerEarnings: data.ownerEarnings,
        commissionPercentage: data.commissionPercentage,
      },
    });
    return record;
  },
};

module.exports = revenueRepository;
