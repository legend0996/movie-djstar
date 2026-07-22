const EventEmitter = require('events');

jest.mock('https', () => ({
  get: jest.fn(),
  request: jest.fn(),
}));

jest.mock('../backend/src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

jest.mock('../backend/src/config', () => ({
  mpesa: {
    consumerKey: 'consumer-key',
    consumerSecret: 'consumer-secret',
    passkey: 'passkey',
    shortCode: '600000',
    tillNumber: '600001',
    environment: 'sandbox',
    callbackUrl: 'https://example.com/callback',
  },
}));

describe('mpesaService', () => {
  let https;
  let mpesaService;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    https = require('https');
    mpesaService = require('../backend/src/services/mpesaService');
  });

  it('formats Kenyan phone numbers and uses the till number in the STK payload', async () => {
    https.get.mockImplementation((url, options, callback) => {
      const res = new EventEmitter();
      process.nextTick(() => {
        res.emit('data', Buffer.from(JSON.stringify({ access_token: 'token', expires_in: '3600' })));
        res.emit('end');
      });
      callback(res);
      return { on: jest.fn(), end: jest.fn() };
    });

    https.request.mockImplementation((options, callback) => {
      const res = new EventEmitter();
      res.statusCode = 200;
      process.nextTick(() => {
        res.emit('data', Buffer.from(JSON.stringify({ ResponseCode: '0', ResponseDescription: 'Success' })));
        res.emit('end');
      });
      callback(res);
      return {
        on: jest.fn(),
        write: jest.fn(),
        end: jest.fn(),
      };
    });

    await mpesaService.initiateSTKPush('0712345678', 500, 'ORDER123', 'Movie');

    const request = https.request.mock.results[0].value;
    const payload = JSON.parse(request.write.mock.calls[0][0]);

    expect(payload.PartyA).toBe('254712345678');
    expect(payload.PartyB).toBe('600001');
    expect(payload.TransactionType).toBe('CustomerPayBillOnline');
  });

  it('rejects invalid payment amounts before sending a request', async () => {
    await expect(mpesaService.initiateSTKPush('0712345678', 0, 'ORDER123', 'Movie')).rejects.toThrow('Invalid payment amount');
    expect(https.request).not.toHaveBeenCalled();
  });

  it('rejects OAuth responses that do not include an access token', async () => {
    https.get.mockImplementation((url, options, callback) => {
      const res = new EventEmitter();
      process.nextTick(() => {
        res.emit('data', Buffer.from(JSON.stringify({ errorMessage: 'invalid_client' })));
        res.emit('end');
      });
      callback(res);
      return { on: jest.fn(), end: jest.fn() };
    });

    await expect(mpesaService.getAccessToken()).rejects.toThrow('Access token missing');
  });
});
