jest.mock('../../services/mpesaService');
jest.mock('../../services/emailService');

const request = require('supertest');
const app = require('../../app');
const movieRepository = require('../../repositories/movieRepository');
const libraryRepository = require('../../repositories/libraryRepository');
const orderRepository = require('../../repositories/orderRepository');
const transactionRepository = require('../../repositories/transactionRepository');
const userRepository = require('../../repositories/userRepository');
const mpesaService = require('../../services/mpesaService');
const { createMockUser, createMockMovie, createMockToken } = require('../helpers/testFactory');

describe('Payments Integration', () => {
  const user = createMockUser();
  const token = createMockToken(user);
  const movie = createMockMovie();

  beforeEach(() => {
    jest.clearAllMocks();
    userRepository.findById.mockResolvedValue(user);
  });

  describe('POST /api/payments/purchase', () => {
    it('returns 200 initiates STK push', async () => {
      movieRepository.findById.mockResolvedValue(movie);
      libraryRepository.isOwned.mockResolvedValue(false);
      orderRepository.create.mockResolvedValue(1);
      orderRepository.addItem.mockResolvedValue(1);
      transactionRepository.create.mockResolvedValue(1);
      mpesaService.initiateSTKPush.mockResolvedValue({
        ResponseCode: '0',
        MerchantRequestID: 'MERCH-001',
        CheckoutRequestID: 'CHECK-001',
        ResponseDescription: 'Success',
      });

      const res = await request(app)
        .post('/api/payments/purchase')
        .set('Authorization', `Bearer ${token}`)
        .send({ movieId: 1, phoneNumber: '0712345678' })
        .expect(200);

      expect(res.body.data.checkoutRequestID).toBe('CHECK-001');
    });

    it('returns 409 on duplicate purchase', async () => {
      movieRepository.findById.mockResolvedValue(movie);
      libraryRepository.isOwned.mockResolvedValue(true);

      const res = await request(app)
        .post('/api/payments/purchase')
        .set('Authorization', `Bearer ${token}`)
        .send({ movieId: 1, phoneNumber: '0712345678' })
        .expect(409);

      expect(res.body.errorCode).toBe('CONFLICT');
    });
  });

  describe('POST /api/payments/mpesa-callback', () => {
    it('returns 200 with ResultCode 0 on success', async () => {
      mpesaService.verifyCallback.mockReturnValue({
        valid: true,
        checkoutRequestID: 'CHECK-001',
        resultCode: 0,
        resultDesc: 'Success',
        mpesaReceipt: 'MPE123456',
        transactionDate: 20240615120000,
        phoneNumber: '254712345678',
      });

      const callbackBody = {
        Body: {
          stkCallback: {
            MerchantRequestID: 'MERCH-001',
            CheckoutRequestID: 'CHECK-001',
            ResultCode: 0,
            ResultDesc: 'Success',
            CallbackMetadata: {
              Item: [
                { Name: 'Amount', Value: 5.99 },
                { Name: 'MpesaReceiptNumber', Value: 'MPE123456' },
                { Name: 'PhoneNumber', Value: '254712345678' },
                { Name: 'TransactionDate', Value: 20240615120000 },
              ],
            },
          },
        },
      };

      const transaction = {
        id: 1,
        order_id: 1,
        user_id: 1,
        amount: 5.99,
        status: 'processing',
      };

      transactionRepository.findByCheckoutRequestId.mockResolvedValue(transaction);
      transactionRepository.update.mockResolvedValue(true);
      orderRepository.updateStatus.mockResolvedValue(true);
      orderRepository.getItems.mockResolvedValue([{ movie_id: 1, item_price: 5.99 }]);
      orderRepository.findById.mockResolvedValue({ order_number: 'DJ-TEST' });
      movieRepository.findById.mockResolvedValue(createMockMovie());
      libraryRepository.addToLibrary.mockResolvedValue(true);
      movieRepository.incrementPurchases.mockResolvedValue(true);

      const res = await request(app)
        .post('/api/payments/mpesa-callback')
        .send(callbackBody)
        .expect(200);

      expect(res.body.ResultCode).toBe(0);
    });
  });

  describe('GET /api/payments/history', () => {
    it('returns 200 with list', async () => {
      orderRepository.findByUser.mockResolvedValue({
        rows: [{ id: 1, order_number: 'DJ-001', total_amount: 5.99 }],
        total: 1,
      });

      const res = await request(app)
        .get('/api/payments/history')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/payments/receipts', () => {
    it('returns 200 with list', async () => {
      const db = require('../../config/database');
      db.execute
        .mockResolvedValueOnce([[{ id: 1, receipt_number: 'RCT-001', order_number: 'DJ-001' }]])
        .mockResolvedValueOnce([[{ total: 1 }]]);

      const res = await request(app)
        .get('/api/payments/receipts')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });
});
