const adminService = require('../services/adminService');
const supportService = require('../services/supportService');
const notificationService = require('../services/notificationService');
const movieRepository = require('../repositories/movieRepository');
const response = require('../utils/response');
const { paginate } = require('../utils/helpers');

const adminController = {
  async getMovieOwnerDashboard(req, res, next) {
    try {
      const dashboard = await adminService.getMovieOwnerDashboard();
      return response.success(res, dashboard);
    } catch (err) {
      next(err);
    }
  },

  async getDeveloperDashboard(req, res, next) {
    try {
      const dashboard = await adminService.getDeveloperDashboard();
      return response.success(res, dashboard);
    } catch (err) {
      next(err);
    }
  },

  async uploadPoster(req, res, next) {
    try {
      if (!req.file) return response.error(res, 'Poster file is required', 400, 'VALIDATION_ERROR');
      const result = await adminService.uploadMoviePoster(req.file, req.params.id);
      return response.success(res, result, 'Poster uploaded successfully');
    } catch (err) {
      next(err);
    }
  },

  async uploadTrailer(req, res, next) {
    try {
      if (!req.file) return response.error(res, 'Trailer file is required', 400, 'VALIDATION_ERROR');
      const result = await adminService.uploadMovieTrailer(req.file, req.params.id);
      return response.success(res, result, 'Trailer uploaded successfully');
    } catch (err) {
      next(err);
    }
  },

  async uploadMovieFile(req, res, next) {
    try {
      if (!req.file) return response.error(res, 'Movie file is required', 400, 'VALIDATION_ERROR');
      const result = await adminService.uploadMovieFile(req.file, req.params.id);
      return response.success(res, { key: result.key }, 'Movie file uploaded successfully');
    } catch (err) {
      next(err);
    }
  },

  async getAuditLogs(req, res, next) {
    try {
      const { page: p, limit: l, action, userId, entityType, startDate, endDate } = req.query;
      const { page, limit } = paginate(p, l, 50);
      const result = await adminService.getAuditLogs({ page, limit, action, userId, entityType, startDate, endDate });
      return response.paginated(res, result.rows, { page, limit, total: result.total });
    } catch (err) {
      next(err);
    }
  },

  async getUserManagement(req, res, next) {
    try {
      const { page: p, limit: l, status, role, search } = req.query;
      const { page, limit } = paginate(p, l);
      const result = await adminService.getUserManagementList({ page, limit, status, role, search });
      return response.paginated(res, result.rows, { page, limit, total: result.total });
    } catch (err) {
      next(err);
    }
  },

  async updateUserStatus(req, res, next) {
    try {
      const result = await adminService.updateUserStatus(req.params.id, req.body.status);
      return response.success(res, result);
    } catch (err) {
      next(err);
    }
  },

  async getSupportTickets(req, res, next) {
    try {
      const { page: p, limit: l, status, priority } = req.query;
      const { page, limit } = paginate(p, l);
      const result = await adminService.getSupportTickets({ page, limit, status, priority });
      return response.paginated(res, result.rows, { page, limit, total: result.total });
    } catch (err) {
      next(err);
    }
  },

  async updateTicketStatus(req, res, next) {
    try {
      const result = await supportService.updateTicketStatus(req.params.id, req.body.status, req.user.id);
      return response.success(res, result);
    } catch (err) {
      next(err);
    }
  },

  async replyToTicket(req, res, next) {
    try {
      const result = await supportService.addReply(req.params.id, req.user.id, req.body.message, true);
      return response.success(res, result, 'Reply added successfully');
    } catch (err) {
      next(err);
    }
  },

  async getAnalytics(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      const analytics = await adminService.getAnalytics({ startDate, endDate });
      return response.success(res, analytics);
    } catch (err) {
      next(err);
    }
  },

  async getRevenueReports(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      const db = require('../config/database');

      const end = endDate ? new Date(endDate) : new Date();
      const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 86400000);

      const [daily] = await db.execute(
        `SELECT DATE(paid_at) as date, SUM(total_amount) as revenue, COUNT(*) as transactions
         FROM orders
         WHERE payment_status = 'paid' AND paid_at >= ? AND paid_at <= ?
         GROUP BY DATE(paid_at)
         ORDER BY date`,
        [start, end]
      );

      const [summary] = await db.execute(
        `SELECT
           COUNT(*) as total_orders,
           COALESCE(SUM(total_amount), 0) as total_revenue,
           COALESCE(AVG(total_amount), 0) as avg_order_value
         FROM orders
         WHERE payment_status = 'paid' AND paid_at >= ? AND paid_at <= ?`,
        [start, end]
      );

      const [topMovies] = await db.execute(
        `SELECT m.title, m.slug, COUNT(oi.id) as sales, SUM(oi.item_price) as revenue
         FROM order_items oi
         JOIN orders o ON oi.order_id = o.id
         JOIN movies m ON oi.movie_id = m.id
         WHERE o.payment_status = 'paid' AND o.paid_at >= ? AND o.paid_at <= ?
         GROUP BY m.id
         ORDER BY revenue DESC
         LIMIT 20`,
        [start, end]
      );

      return response.success(res, { daily, summary: summary[0], topMovies, period: { start, end } });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = adminController;
