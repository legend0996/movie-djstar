const config = require('../config');
const prisma = require('../config/database');
const mpesaService = require('./mpesaService');
const emailService = require('./emailService');
const movieRepository = require('../repositories/movieRepository');
const orderRepository = require('../repositories/orderRepository');
const transactionRepository = require('../repositories/transactionRepository');
const libraryRepository = require('../repositories/libraryRepository');
const receiptRepository = require('../repositories/receiptRepository');
const revenueRepository = require('../repositories/revenueRepository');
const userRepository = require('../repositories/userRepository');
const notificationService = require('./notificationService');
const { generateOrderNumber, generateReceiptNumber, paginate } = require('../utils/helpers');
const { logActivity } = require('../middleware/activityLogger');
const {
  NotFoundError,
  ValidationError,
  PaymentError,
  ConflictError,
  ForbiddenError,
} = require('../utils/errors');
const { MOVIE_STATUS, ORDER_STATUS, TRANSACTION_STATUS } = require('../constants');
const logger = require('../utils/logger');
const { paymentLogger } = require('../utils/logger');

function parseMpesaDate(dateValue) {
  if (!dateValue) {return new Date();}
  const str = String(dateValue).replace(/\D/g, '');
  if (str.length === 14) {
    const y = str.slice(0, 4), M = str.slice(4, 6) - 1, d = str.slice(6, 8),
      h = str.slice(8, 10), m = str.slice(10, 12), s = str.slice(12, 14);
    return new Date(y, M, d, h, m, s);
  }
  const parsed = new Date(dateValue);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

const paymentService = {
  async initiatePurchase(userId, movieId, phoneNumber) {
    const movie = await movieRepository.findById(movieId);
    if (!movie) {
      throw new NotFoundError('Movie not found');
    }

    if (movie.status !== MOVIE_STATUS.PUBLISHED) {
      throw new ValidationError('This movie is not available for purchase');
    }

    const alreadyOwned = await libraryRepository.isOwned(userId, movieId);
    if (alreadyOwned) {
      throw new ConflictError('You already own this movie');
    }

    if (movie.is_free || movie.price === 0) {
      const orderNumber = generateOrderNumber();
      const orderId = await orderRepository.create({
        userId,
        orderNumber,
        totalAmount: 0,
        status: ORDER_STATUS.COMPLETED,
        paymentStatus: 'paid',
        notes: 'Free movie',
      });

      await orderRepository.addItem(orderId, movieId, 0);
      await libraryRepository.addToLibrary(userId, movieId, orderId, 0);
      await movieRepository.incrementPurchases(movieId);

      await logActivity(userId, 'free_purchase', 'order', orderId, { movieId, movieTitle: movie.title });

      return { orderId, orderNumber, amount: 0, message: 'Movie added to your library' };
    }

    const orderNumber = generateOrderNumber();
    const orderId = await orderRepository.create({
      userId,
      orderNumber,
      totalAmount: movie.price,
      status: ORDER_STATUS.PENDING,
      paymentStatus: 'pending',
    });

    await orderRepository.addItem(orderId, movieId, movie.price);

    const transactionId = await transactionRepository.create({
      userId,
      orderId,
      phoneNumber,
      amount: movie.price,
      status: TRANSACTION_STATUS.PENDING,
      metadata: { movieId, movieTitle: movie.title, orderNumber },
    });

    let stkResponse;
    try {
      stkResponse = await mpesaService.initiateSTKPush(
        phoneNumber,
        movie.price,
        orderNumber,
        `Purchase: ${movie.title}`,
      );
    } catch (err) {
      await transactionRepository.update(transactionId, {
        status: TRANSACTION_STATUS.FAILED,
        resultDescription: err.message,
      });
      paymentLogger.error('STK push initiation failed', {
        transactionId,
        error: err.message,
        userId,
        movieId,
        amount: movie.price,
      });
      throw new PaymentError(`Payment service error: ${err.message}`);
    }

    if (stkResponse.ResponseCode === '0') {
      await transactionRepository.update(transactionId, {
        merchantRequestId: stkResponse.MerchantRequestID,
        checkoutRequestId: stkResponse.CheckoutRequestID,
        status: 'processing',
      });

      await logActivity(userId, 'payment_initiated', 'transaction', transactionId, {
        movieId,
        amount: movie.price,
        merchantRequestID: stkResponse.MerchantRequestID,
      });

      paymentLogger.info('STK push initiated successfully', {
        transactionId,
        checkoutRequestID: stkResponse.CheckoutRequestID,
        amount: movie.price,
      });

      return {
        orderId,
        transactionId,
        orderNumber,
        amount: movie.price,
        merchantRequestID: stkResponse.MerchantRequestID,
        checkoutRequestID: stkResponse.CheckoutRequestID,
        responseDescription: stkResponse.ResponseDescription,
        message: 'STK Push sent. Check your phone to complete payment.',
      };
    }

    // Handle M-Pesa error response codes
    const mpesaErrorMap = {
      '1': 'Insufficient funds or invalid account',
      '2': 'System error - please try again',
      '17': 'Invalid phone number',
      '20': 'Invalid amount',
      '26': 'Transaction rejected',
      '8': 'System error - contact administrator',
    };

    const errorMessage = mpesaErrorMap[stkResponse.ResponseCode] ||
                         stkResponse.ResponseDescription ||
                         'M-Pesa payment initiation failed';

    await transactionRepository.update(transactionId, {
      status: TRANSACTION_STATUS.FAILED,
      resultCode: stkResponse.ResponseCode,
      resultDescription: errorMessage,
    });

    paymentLogger.warn('STK push rejected by M-Pesa', {
      transactionId,
      responseCode: stkResponse.ResponseCode,
      responseDescription: stkResponse.ResponseDescription,
      amount: movie.price,
    });

    throw new PaymentError(errorMessage);
  },

  async handleCallback(callbackBody) {
    const callback = mpesaService.verifyCallback(callbackBody);
    if (!callback.valid) {
      logger.warn('Invalid M-Pesa callback received', { body: callbackBody });
      return { valid: false };
    }

    paymentLogger.info('M-Pesa callback received', {
      checkoutRequestID: callback.checkoutRequestID,
      resultCode: callback.resultCode,
      mpesaReceipt: callback.mpesaReceipt,
    });

    const transaction = await transactionRepository.findByCheckoutRequestId(callback.checkoutRequestID);
    if (!transaction) {
      logger.error('Transaction not found for callback', {
        checkoutRequestID: callback.checkoutRequestID,
      });
      return { valid: false, reason: 'Transaction not found' };
    }

    if (transaction.status === TRANSACTION_STATUS.SUCCESS) {
      logger.warn('Duplicate callback received', {
        transactionId: transaction.id,
        checkoutRequestID: callback.checkoutRequestID,
      });
      return { valid: true, alreadyProcessed: true };
    }

    await transactionRepository.update(transaction.id, {
      callbackReceivedAt: new Date(),
      callbackData: callbackBody,
      resultCode: String(callback.resultCode),
      resultDescription: callback.resultDesc,
    });

    if (Number(callback.resultCode) === 0) {
      await transactionRepository.update(transaction.id, {
        status: TRANSACTION_STATUS.SUCCESS,
        mpesaReceipt: callback.mpesaReceipt,
        transactionDate: parseMpesaDate(callback.transactionDate),
      });

      await orderRepository.updateStatus(transaction.orderId, {
        status: ORDER_STATUS.COMPLETED,
        paymentStatus: 'paid',
        paidAt: new Date(),
      });

      const orderItems = await orderRepository.getItems(transaction.orderId);

      for (const item of orderItems) {
        await libraryRepository.addToLibrary(
          transaction.userId,
          item.movieId,
          transaction.orderId,
          item.itemPrice,
        );
        await movieRepository.incrementPurchases(item.movieId);
      }

      const commissionPercentage = config.commission.developerPercentage;
      const developerCommission = (transaction.amount * commissionPercentage) / 100;
      const ownerEarnings = transaction.amount - developerCommission;

      await revenueRepository.create({
        orderId: transaction.orderId,
        transactionId: transaction.id,
        totalAmount: transaction.amount,
        developerCommission,
        ownerEarnings,
        commissionPercentage,
      });

      const receiptNumber = generateReceiptNumber();
      const order = await orderRepository.findById(transaction.orderId);
      const movie = orderItems.length > 0
        ? await movieRepository.findById(orderItems[0].movieId)
        : null;

      const receiptData = {
        receiptNumber,
        orderNumber: order?.orderNumber,
        transactionId: transaction.id,
        mpesaReceipt: callback.mpesaReceipt,
        movieTitle: movie?.title,
        amount: transaction.amount,
        phoneNumber: callback.phoneNumber,
        purchaseDate: new Date().toISOString(),
      };

      await receiptRepository.create({
        orderId: transaction.orderId,
        userId: transaction.userId,
        receiptNumber,
        receiptData,
      });

      const user = await userRepository.findById(transaction.userId);

      try {
        await emailService.sendPurchaseReceipt(user.email, user.username, receiptData);
      } catch (err) {
        logger.error('Failed to send receipt email', { error: err.message, userId: transaction.userId });
      }

      await notificationService.create(
        transaction.userId,
        'purchase_success',
        `Purchase Complete: ${movie?.title || 'Movie'}`,
        `You have successfully purchased "${movie?.title || 'Movie'}". Enjoy watching!`,
        { movieId: movie?.id, orderId: transaction.orderId, receiptNumber },
      );

      await logActivity(transaction.userId, 'purchase_completed', 'order', transaction.orderId, {
        amount: transaction.amount,
        mpesaReceipt: callback.mpesaReceipt,
        movieTitle: movie?.title,
      });

      paymentLogger.info('Purchase completed successfully', {
        userId: transaction.userId,
        orderId: transaction.orderId,
        amount: transaction.amount,
        receiptNumber,
      });

      return { valid: true, success: true };
    }

    await transactionRepository.update(transaction.id, {
      status: TRANSACTION_STATUS.FAILED,
      resultCode: String(callback.resultCode),
      resultDescription: callback.resultDesc || 'Payment failed',
    });

    await orderRepository.updateStatus(transaction.orderId, {
      status: ORDER_STATUS.FAILED,
      paymentStatus: 'failed',
    });

    await notificationService.create(
      transaction.userId,
      'payment_failed',
      'Payment Failed',
      `Payment for your order was not successful. Reason: ${callback.resultDesc || 'Unknown error'}`,
      { orderId: transaction.orderId, resultCode: callback.resultCode },
    );

    await logActivity(transaction.userId, 'payment_failed', 'transaction', transaction.id, {
      resultCode: callback.resultCode,
      resultDesc: callback.resultDesc,
    });

    return { valid: true, success: false };
  },

  async handleTimeout(checkoutRequestId) {
    const transaction = await transactionRepository.findByCheckoutRequestId(checkoutRequestId);
    if (!transaction) {
      logger.warn('Timeout for unknown transaction', { checkoutRequestId });
      return;
    }

    if (transaction.status === TRANSACTION_STATUS.PROCESSING) {
      await transactionRepository.update(transaction.id, {
        status: TRANSACTION_STATUS.EXPIRED,
        resultDescription: 'Payment request timed out',
      });

      await orderRepository.updateStatus(transaction.orderId, {
        status: ORDER_STATUS.CANCELLED,
        paymentStatus: 'failed',
      });

      await logActivity(transaction.userId, 'payment_timeout', 'transaction', transaction.id);
      paymentLogger.info('Payment timeout processed', { transactionId: transaction.id, checkoutRequestId });
    }
  },

  async queryPaymentStatus(checkoutRequestId) {
    const transaction = await transactionRepository.findByCheckoutRequestId(checkoutRequestId);
    if (!transaction) {
      throw new NotFoundError('Transaction not found');
    }

    if (transaction.status === 'processing') {
      try {
        const result = await mpesaService.querySTKStatus(checkoutRequestId);
        const rawCode = result.ResultCode;
        if (rawCode !== undefined && rawCode !== null) {
          const resultCode = Number(rawCode);
          if (resultCode === 0) {
            return { status: TRANSACTION_STATUS.SUCCESS, message: 'Payment successful' };
          }
          const stillProcessingCodes = [1, 2, 7, 12, 1037, 2001];
          const desc = (result.ResultDesc || '').toLowerCase();
          const isStillProcessing = stillProcessingCodes.includes(resultCode) ||
            desc.includes('still under processing') ||
            desc.includes('still processing') ||
            desc.includes('pending');
          if (isStillProcessing) {
            return { status: 'processing', message: result.ResultDesc || 'Transaction is still being processed' };
          }
          return { status: TRANSACTION_STATUS.FAILED, message: result.ResultDesc || 'Payment failed' };
        }
      } catch (err) {
        logger.error('Failed to query STK status', { error: err.message, checkoutRequestId });
      }
    }

    return {
      status: transaction.status,
      message: transaction.resultDescription || undefined,
      mpesaReceipt: transaction.mpesaReceipt,
    };
  },

  async getPurchaseHistory(userId, { page, limit } = {}) {
    const { page: p, limit: l } = paginate(page, limit);
    return orderRepository.findByUser(userId, { page: p, limit: l });
  },

  async getOrderDetails(orderId, userId, userRole) {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundError('Order not found');
    }
    if (order.userId !== userId && userRole !== 'developer') {
      throw new ForbiddenError('Forbidden');
    }
    return order;
  },
};

module.exports = paymentService;
