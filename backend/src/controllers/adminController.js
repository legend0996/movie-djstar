const adminService = require('../services/adminService');
const supportService = require('../services/supportService');
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
      const result = await adminService.uploadMoviePoster(req.file, req.params.id);
      return response.success(res, result, 'Poster uploaded successfully');
    } catch (err) {
      next(err);
    }
  },

  async uploadTrailer(req, res, next) {
    try {
      const result = await adminService.uploadMovieTrailer(req.file, req.params.id);
      return response.success(res, result, 'Trailer uploaded successfully');
    } catch (err) {
      next(err);
    }
  },

  async uploadMovieFile(req, res, next) {
    try {
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

  async updateUser(req, res, next) {
    try {
      const userRepository = require('../repositories/userRepository');
      const result = await userRepository.update(Number(req.params.id), req.body);
      return response.success(res, result, 'User updated');
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
      const reports = await adminService.getRevenueReports({ startDate, endDate });
      return response.success(res, reports);
    } catch (err) {
      next(err);
    }
  },
};

module.exports = adminController;
