const config = require('../config');
const mpesaService = require('./mpesaService');
const emailService = require('./emailService');
const movieRepository = require('../repositories/movieRepository');
const orderRepository = require('../repositories/orderRepository');
const transactionRepository = require('../repositories/transactionRepository');
const libraryRepository = require('../repositories/libraryRepository');
const receiptRepository = require('../repositories/receiptRepository');
const userRepository = require('../repositories/userRepository');
const notificationService = require('./notificationService');
const { generateOrderNumber, generateReceiptNumber } = require('../utils/helpers');
const { logActivity } = require('../middleware/activityLogger');
const {
  NotFoundError,
  ValidationError,
  PaymentError,
  ConflictError,
} = require('../utils/errors');
const { MOVIE_STATUS, ORDER_STATUS, TRANSACTION_STATUS } = require('../constants');
const logger = require('../utils/logger');
const { paymentLogger } = require('../utils/logger');

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

    if (callback.resultCode === 0) {
      try {
        const prisma = require('../config/database');
        const r = await prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            status: 'successful',
            mpesaReceipt: callback.mpesaReceipt,
            transactionDate: callback.transactionDate
              ? new Date(callback.transactionDate.toString())
              : new Date(),
          },
        });
      } catch (e) {
        console.log('DIRECT_UPDATE_ERROR_MSG=' + JSON.stringify({message: e.message, code: e.code, name: e.name, stack: (e.stack || '').slice(0, 200)}));
      }

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

      await prisma.revenueRecord.create({
        data: {
          orderId: transaction.orderId,
          transactionId: transaction.id,
          totalAmount: transaction.amount,
          developerCommission,
          ownerEarnings,
          commissionPercentage,
        },
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
      status: ORDER_STATUS.CANCELLED,
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

    if (transaction.status === 'processing') {
      await transactionRepository.update(transaction.id, {
        status: 'expired',
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
        if (result.ResultCode !== undefined) {
          if (result.ResultCode === 0) {
            return { status: TRANSACTION_STATUS.SUCCESS, message: 'Payment successful' };
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
};

module.exports = paymentService;
