const prisma = require('../config/database');

const notificationRepository = {
  async create(userId, type, title, message, data) {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        data: data || undefined
      }
    });
    return notification.id;
  },

  async createSystemNotification(type, title, message, data) {
    const notification = await prisma.notification.create({
      data: {
        userId: null,
        type,
        title,
        message,
        data: data || undefined
      }
    });
    return notification.id;
  },

  async getUserNotifications(userId, { page = 1, limit = 20, unreadOnly = false } = {}) {
    const where = { userId };
    if (unreadOnly) {
      where.isRead = false;
    }

    const [rows, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.notification.count({ where })
    ]);

    return { rows, total };
  },

  async markAsRead(notificationId, userId) {
    await prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true, readAt: new Date() }
    });
    return true;
  },

  async markAllAsRead(userId) {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() }
    });
    return true;
  },

  async getUnreadCount(userId) {
    return prisma.notification.count({
      where: { userId, isRead: false }
    });
  }
};

module.exports = notificationRepository;
