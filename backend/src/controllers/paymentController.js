const paymentService = require('../services/paymentService');
const receiptRepository = require('../repositories/receiptRepository');
const response = require('../utils/response');
const { paginate } = require('../utils/helpers');

const paymentController = {
  async initiatePurchase(req, res, next) {
    try {
      const result = await paymentService.initiatePurchase(req.user.id, req.body.movieId, req.body.phoneNumber);
      return response.success(res, result, 'STK Push sent to your phone');
    } catch (err) {
      next(err);
    }
  },

  async mpesaCallback(req, res, next) {
    try {
      const result = await paymentService.handleCallback(req.body);
      const mpesaResponse = result.valid && result.success
        ? { ResultCode: 0, ResultDesc: 'Success' }
        : result.alreadyProcessed
          ? { ResultCode: 0, ResultDesc: 'Already processed' }
          : { ResultCode: 1, ResultDesc: result.reason || 'Failed' };
      return res.status(200).json(mpesaResponse);
    } catch (err) {
      return res.status(200).json({ ResultCode: 1, ResultDesc: 'Server error' });
    }
  },

  async mpesaTimeout(req, res, next) {
    try {
      await paymentService.handleTimeout(req.body.CheckoutRequestID);
      return res.status(200).json({ ResultCode: 0, ResultDesc: 'Timeout acknowledged' });
    } catch (err) {
      return res.status(200).json({ ResultCode: 1, ResultDesc: 'Error' });
    }
  },

  async queryPaymentStatus(req, res, next) {
    try {
      const result = await paymentService.queryPaymentStatus(req.params.checkoutRequestId);
      return response.success(res, result);
    } catch (err) {
      next(err);
    }
  },

  async getPurchaseHistory(req, res, next) {
    try {
      const { page: p, limit: l } = req.query;
      const result = await paymentService.getPurchaseHistory(req.user.id, { page: p, limit: l });
      return response.paginated(res, result.rows, { page: result.page, limit: result.limit, total: result.total });
    } catch (err) {
      next(err);
    }
  },

  async getOrderDetails(req, res, next) {
    try {
      const order = await paymentService.getOrderDetails(req.params.id, req.user.id, req.user.role);
      return response.success(res, order);
    } catch (err) {
      next(err);
    }
  },

  async getReceipts(req, res, next) {
    try {
      const { page: p, limit: l } = req.query;
      const { page, limit } = paginate(p, l);
      const result = await receiptRepository.findByUser(req.user.id, { page, limit });
      return response.paginated(res, result.rows, { page, limit, total: result.total });
    } catch (err) {
      next(err);
    }
  },

  async getReceiptById(req, res, next) {
    try {
      const receipt = await receiptRepository.findByUserAndId(parseInt(req.params.id), req.user.id);
      if (!receipt) {
        return response.error(res, 'Receipt not found', 404, 'NOT_FOUND');
      }
      return response.success(res, receipt);
    } catch (err) {
      next(err);
    }
  },
};

module.exports = paymentController;
