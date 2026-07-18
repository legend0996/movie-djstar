const notificationRepository = require('../repositories/notificationRepository');

const notificationService = {
  async create(userId, type, title, message, data = null) {
    return notificationRepository.create(userId, type, title, message, data);
  },

  async createSystemNotification(type, title, message, data = null) {
    return notificationRepository.createSystemNotification(type, title, message, data);
  },

  async getUserNotifications(userId, { page = 1, limit = 20, unreadOnly = false } = {}) {
    const { rows, total } = await notificationRepository.getUserNotifications(userId, {
      page, limit, unreadOnly,
    });
    const unreadCount = await notificationRepository.getUnreadCount(userId);
    return { rows, total, unread: unreadCount };
  },

  async markAsRead(notificationId, userId) {
    return notificationRepository.markAsRead(notificationId, userId);
  },

  async markAllAsRead(userId) {
    return notificationRepository.markAllAsRead(userId);
  },

  async getUnreadCount(userId) {
    return notificationRepository.getUnreadCount(userId);
  },
};

module.exports = notificationService;
