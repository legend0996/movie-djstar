const supportService = require('../services/supportService');
const response = require('../utils/response');
const { paginate } = require('../utils/helpers');

const supportController = {
  async createTicket(req, res, next) {
    try {
      const result = await supportService.createTicket(req.user.id, req.body);
      return response.created(res, result, 'Support ticket created successfully');
    } catch (err) {
      next(err);
    }
  },

  async getMyTickets(req, res, next) {
    try {
      const { page: p, limit: l } = req.query;
      const { page, limit } = paginate(p, l);
      const result = await supportService.getUserTickets(req.user.id, { page, limit });
      return response.paginated(res, result.rows, { page, limit, total: result.total });
    } catch (err) {
      next(err);
    }
  },

  async getTicketDetails(req, res, next) {
    try {
      const ticket = await supportService.getTicket(req.params.id, req.user.id);
      return response.success(res, ticket);
    } catch (err) {
      next(err);
    }
  },

  async replyToTicket(req, res, next) {
    try {
      const result = await supportService.addReply(req.params.id, req.user.id, req.body.message, false);
      return response.success(res, result, 'Reply added successfully');
    } catch (err) {
      next(err);
    }
  },
};

module.exports = supportController;
