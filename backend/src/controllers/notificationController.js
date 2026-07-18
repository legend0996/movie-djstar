const notificationService = require('../services/notificationService');
const response = require('../utils/response');
const { paginate } = require('../utils/helpers');

const notificationController = {
  async getNotifications(req, res, next) {
    try {
      const { page: p, limit: l, unreadOnly } = req.query;
      const { page, limit } = paginate(p, l);
      const result = await notificationService.getUserNotifications(req.user.id, {
        page,
        limit,
        unreadOnly: unreadOnly === 'true',
      });
      return response.paginated(res, result.rows, { page, limit, total: result.total });
    } catch (err) {
      next(err);
    }
  },

  async markAsRead(req, res, next) {
    try {
      await notificationService.markAsRead(req.params.id, req.user.id);
      return response.success(res, null, 'Notification marked as read');
    } catch (err) {
      next(err);
    }
  },

  async markAllAsRead(req, res, next) {
    try {
      const count = await notificationService.markAllAsRead(req.user.id);
      return response.success(res, { markedRead: count }, 'All notifications marked as read');
    } catch (err) {
      next(err);
    }
  },

  async getUnreadCount(req, res, next) {
    try {
      const count = await notificationService.getUnreadCount(req.user.id);
      return response.success(res, { unreadCount: count });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = notificationController;
