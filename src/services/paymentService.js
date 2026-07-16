const db = require('../config/database');
const config = require('../config');
const mpesaService = require('./mpesaService');
const emailService = require('./emailService');
const movieRepository = require('../repositories/movieRepository');
const orderRepository = require('../repositories/orderRepository');
const transactionRepository = require('../repositories/transactionRepository');
const libraryRepository = require('../repositories/libraryRepository');
const { generateOrderNumber, generateReceiptNumber } = require('../utils/helpers');
const { logActivity } = require('../middleware/activityLogger');
const {
  NotFoundError,
  ValidationError,
  PaymentError,
  ConflictError,
} = require('../utils/errors');
const logger = require('../utils/logger');

const paymentService = {
  async initiatePurchase(userId, movieId, phoneNumber) {
    const movie = await movieRepository.findById(movieId);
    if (!movie) {
      throw new NotFoundError('Movie not found');
    }

    if (movie.status !== 'published') {
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
        status: 'completed',
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
      status: 'pending',
      paymentStatus: 'pending',
    });

    await orderRepository.addItem(orderId, movieId, movie.price);

    const transactionId = await transactionRepository.create({
      userId,
      orderId,
      phoneNumber,
      amount: movie.price,
      status: 'pending',
      metadata: { movieId, movieTitle: movie.title, orderNumber },
    });

    let stkResponse;
    try {
      stkResponse = await mpesaService.initiateSTKPush(
        phoneNumber,
        movie.price,
        orderNumber,
        `Purchase: ${movie.title}`
      );
    } catch (err) {
      await transactionRepository.update(transactionId, { status: 'failed', result_description: err.message });
      throw new PaymentError('Failed to initiate payment. Please try again.');
    }

    if (stkResponse.ResponseCode === '0') {
      await transactionRepository.update(transactionId, {
        merchant_request_id: stkResponse.MerchantRequestID,
        checkout_request_id: stkResponse.CheckoutRequestID,
        status: 'processing',
      });

      await logActivity(userId, 'payment_initiated', 'transaction', transactionId, {
        movieId,
        amount: movie.price,
        merchantRequestID: stkResponse.MerchantRequestID,
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
    } else {
      await transactionRepository.update(transactionId, {
        status: 'failed',
        result_code: stkResponse.ResponseCode,
        result_description: stkResponse.ResponseDescription || 'STK Push failed',
      });

      throw new PaymentError(stkResponse.ResponseDescription || 'Payment initiation failed');
    }
  },

  async handleCallback(callbackBody) {
    const callback = mpesaService.verifyCallback(callbackBody);
    if (!callback.valid) {
      logger.warn('Invalid M-Pesa callback received', { body: callbackBody });
      return { valid: false };
    }

    logger.info('M-Pesa callback received', {
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

    if (transaction.status === 'successful') {
      logger.warn('Duplicate callback received', {
        transactionId: transaction.id,
        checkoutRequestID: callback.checkoutRequestID,
      });
      return { valid: true, alreadyProcessed: true };
    }

    await transactionRepository.update(transaction.id, {
      callback_received_at: new Date(),
      callback_data: callbackBody,
      result_code: String(callback.resultCode),
      result_description: callback.resultDesc,
    });

    if (callback.resultCode === 0) {
      await transactionRepository.update(transaction.id, {
        status: 'successful',
        mpesa_receipt: callback.mpesaReceipt,
        transaction_date: callback.transactionDate ? new Date(callback.transactionDate.toString()) : new Date(),
      });

      await orderRepository.updateStatus(transaction.order_id, {
        status: 'completed',
        paymentStatus: 'paid',
        paidAt: new Date(),
      });

      const orderItems = await orderRepository.getItems(transaction.order_id);

      for (const item of orderItems) {
        await libraryRepository.addToLibrary(
          transaction.user_id,
          item.movie_id,
          transaction.order_id,
          item.item_price
        );
        await movieRepository.incrementPurchases(item.movie_id);
      }

      const commissionPercentage = config.commission.developerPercentage;
      const developerCommission = (transaction.amount * commissionPercentage) / 100;
      const ownerEarnings = transaction.amount - developerCommission;

      await db.execute(
        `INSERT INTO revenue_records (order_id, transaction_id, total_amount, developer_commission, owner_earnings, commission_percentage)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [transaction.order_id, transaction.id, transaction.amount, developerCommission, ownerEarnings, commissionPercentage]
      );

      const receiptNumber = generateReceiptNumber();
      const order = await orderRepository.findById(transaction.order_id);
      const movie = orderItems.length > 0
        ? await movieRepository.findById(orderItems[0].movie_id)
        : null;

      const receiptData = {
        receiptNumber,
        orderNumber: order?.order_number,
        transactionId: transaction.id,
        mpesaReceipt: callback.mpesaReceipt,
        movieTitle: movie?.title,
        amount: transaction.amount,
        phoneNumber: callback.phoneNumber,
        purchaseDate: new Date().toISOString(),
      };

      await db.execute(
        `INSERT INTO receipts (order_id, user_id, receipt_number, receipt_data)
         VALUES (?, ?, ?, ?)`,
        [transaction.order_id, transaction.user_id, receiptNumber, JSON.stringify(receiptData)]
      );

      const user = await require('../repositories/userRepository').findById(transaction.user_id);

      try {
        await emailService.sendPurchaseReceipt(
          user.email,
          user.username,
          receiptData
        );
      } catch (err) {
        logger.error('Failed to send receipt email', { error: err.message, userId: transaction.user_id });
      }

      await db.execute(
        `INSERT INTO notifications (user_id, type, title, message, data)
         VALUES (?, 'purchase_success', ?, ?, ?)`,
        [
          transaction.user_id,
          `Purchase Complete: ${movie?.title || 'Movie'}`,
          `You have successfully purchased "${movie?.title || 'Movie'}". Enjoy watching!`,
          JSON.stringify({ movieId: movie?.id, orderId: transaction.order_id, receiptNumber }),
        ]
      );

      await logActivity(transaction.user_id, 'purchase_completed', 'order', transaction.order_id, {
        amount: transaction.amount,
        mpesaReceipt: callback.mpesaReceipt,
        movieTitle: movie?.title,
      });

      logger.info('Purchase completed successfully', {
        userId: transaction.user_id,
        orderId: transaction.order_id,
        amount: transaction.amount,
        receiptNumber,
      });

      return { valid: true, success: true };
    } else {
      await transactionRepository.update(transaction.id, {
        status: 'failed',
        result_code: String(callback.resultCode),
        result_description: callback.resultDesc || 'Payment failed',
      });

      await orderRepository.updateStatus(transaction.order_id, {
        status: 'failed',
        paymentStatus: 'failed',
      });

      await db.execute(
        `INSERT INTO notifications (user_id, type, title, message, data)
         VALUES (?, 'payment_failed', ?, ?, ?)`,
        [
          transaction.user_id,
          'Payment Failed',
          `Payment for your order was not successful. Reason: ${callback.resultDesc || 'Unknown error'}`,
          JSON.stringify({ orderId: transaction.order_id, resultCode: callback.resultCode }),
        ]
      );

      await logActivity(transaction.user_id, 'payment_failed', 'transaction', transaction.id, {
        resultCode: callback.resultCode,
        resultDesc: callback.resultDesc,
      });

      return { valid: true, success: false };
    }
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
        result_description: 'Payment request timed out',
      });

      await orderRepository.updateStatus(transaction.order_id, {
        status: 'failed',
        paymentStatus: 'failed',
      });

      await logActivity(transaction.user_id, 'payment_timeout', 'transaction', transaction.id);
      logger.info('Payment timeout processed', { transactionId: transaction.id, checkoutRequestId });
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
            return { status: 'successful', message: 'Payment successful' };
          } else {
            return { status: 'failed', message: result.ResultDesc || 'Payment failed' };
          }
        }
      } catch (err) {
        logger.error('Failed to query STK status', { error: err.message, checkoutRequestId });
      }
    }

    return {
      status: transaction.status,
      message: transaction.result_description || undefined,
      mpesaReceipt: transaction.mpesa_receipt,
    };
  },
};

module.exports = paymentService;
