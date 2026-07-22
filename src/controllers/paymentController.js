const paymentService = require('../services/paymentService');
const orderRepository = require('../repositories/orderRepository');
const transactionRepository = require('../repositories/transactionRepository');
const response = require('../utils/response');
const { paginate } = require('../utils/helpers');
const logger = require('../utils/logger');

const paymentController = {
  async initiatePurchase(req, res, next) {
    try {
      const result = await paymentService.initiatePurchase(
        req.user.id,
        req.body.movieId,
        req.body.phoneNumber
      );
      return response.success(res, result, 'STK Push sent to your phone');
    } catch (err) {
      next(err);
    }
  },

  async mpesaCallback(req, res, next) {
    try {
      const signature = req.headers['x-mpesa-signature'] || req.headers['x-signature'] || req.headers.signature;
      logger.info('M-Pesa callback received', {
        checkoutRequestID: req.body?.Body?.stkCallback?.CheckoutRequestID || null,
        resultCode: req.body?.Body?.stkCallback?.ResultCode || null,
      });

      const result = await paymentService.handleCallback(req.body, signature);

      if (result.valid && result.success) {
        return res.status(200).json({ ResultCode: 0, ResultDesc: 'Success' });
      } else if (result.valid && !result.success) {
        return res.status(200).json({ ResultCode: 1, ResultDesc: 'Failed' });
      } else if (result.alreadyProcessed) {
        return res.status(200).json({ ResultCode: 0, ResultDesc: 'Already processed' });
      } else {
        return res.status(200).json({ ResultCode: 1, ResultDesc: 'Invalid callback' });
      }
    } catch (err) {
      logger.error('M-Pesa callback error', { error: err.message });
      return res.status(200).json({ ResultCode: 1, ResultDesc: 'Server error' });
    }
  },

  async mpesaTimeout(req, res, next) {
    try {
      const { CheckoutRequestID } = req.body;
      if (CheckoutRequestID) {
        await paymentService.handleTimeout(CheckoutRequestID);
      }
      return res.status(200).json({ ResultCode: 0, ResultDesc: 'Timeout acknowledged' });
    } catch (err) {
      logger.error('M-Pesa timeout error', { error: err.message });
      return res.status(200).json({ ResultCode: 1, ResultDesc: 'Error' });
    }
  },

  async queryPaymentStatus(req, res, next) {
    try {
      const { checkoutRequestId } = req.params;
      const result = await paymentService.queryPaymentStatus(checkoutRequestId);
      return response.success(res, result);
    } catch (err) {
      next(err);
    }
  },

  async getPurchaseHistory(req, res, next) {
    try {
      const { page: p, limit: l } = req.query;
      const { page, limit } = paginate(p, l);
      const result = await orderRepository.findByUser(req.user.id, { page, limit });
      return response.paginated(res, result.rows, { page, limit, total: result.total });
    } catch (err) {
      next(err);
    }
  },

  async getOrderDetails(req, res, next) {
    try {
      const order = await orderRepository.findById(req.params.id);
      if (!order) {
        return response.error(res, 'Order not found', 404, 'NOT_FOUND');
      }
      if (order.user_id !== req.user.id && req.user.role !== 'developer') {
        return response.error(res, 'Forbidden', 403, 'FORBIDDEN');
      }

      const items = await orderRepository.getItems(order.id);
      order.itemsList = items;

      return response.success(res, order);
    } catch (err) {
      next(err);
    }
  },

  async getReceipts(req, res, next) {
    try {
      const { page: p, limit: l } = req.query;
      const { page, limit } = paginate(p, l);
      const offset = (page - 1) * limit;

      const [rows] = await require('../config/database').execute(
        `SELECT r.*, o.order_number
         FROM receipts r
         JOIN orders o ON r.order_id = o.id
         WHERE r.user_id = ?
         ORDER BY r.created_at DESC
         LIMIT ? OFFSET ?`,
        [req.user.id, limit, offset]
      );

      const [countResult] = await require('../config/database').execute(
        `SELECT COUNT(*) as total FROM receipts WHERE user_id = ?`,
        [req.user.id]
      );

      return response.paginated(res, rows, { page, limit, total: countResult[0].total });
    } catch (err) {
      next(err);
    }
  },

  async getReceiptById(req, res, next) {
    try {
      const [rows] = await require('../config/database').execute(
        `SELECT r.*, o.order_number
         FROM receipts r
         JOIN orders o ON r.order_id = o.id
         WHERE r.id = ? AND r.user_id = ?`,
        [req.params.id, req.user.id]
      );

      if (!rows.length) {
        return response.error(res, 'Receipt not found', 404, 'NOT_FOUND');
      }

      return response.success(res, rows[0]);
    } catch (err) {
      next(err);
    }
  },
};

module.exports = paymentController;
