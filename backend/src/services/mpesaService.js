const https = require('https');
const crypto = require('crypto');
const config = require('../config');
const logger = require('../utils/logger');

let accessToken = null;
let tokenExpiry = null;

const mpesaService = {
  async getAccessToken() {
    if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
      return accessToken;
    }

    const auth = Buffer.from(`${config.mpesa.consumerKey}:${config.mpesa.consumerSecret}`).toString('base64');
    const url = config.mpesa.environment === 'production'
      ? 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
      : 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';

    return new Promise((resolve, reject) => {
      const req = https.get(url, {
        headers: { Authorization: `Basic ${auth}` },
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
            logger.error('M-Pesa token request failed', { statusCode: res.statusCode, data });
            reject(new Error('Failed to get M-Pesa access token'));
            return;
          }

          try {
            const parsed = JSON.parse(data);
            if (!parsed.access_token) {
              logger.error('M-Pesa token response missing access token', { data });
              reject(new Error('Access token missing'));
              return;
            }

            accessToken = parsed.access_token;
            tokenExpiry = Date.now() + (parseInt(parsed.expires_in, 10) - 60) * 1000;
            resolve(accessToken);
          } catch (err) {
            logger.error('M-Pesa token parse failed', { error: err.message, data });
            reject(new Error('Failed to get M-Pesa access token'));
          }
        });
      });

      req.on('error', (err) => {
        logger.error('M-Pesa token request failed', { error: err.message });
        reject(new Error('Failed to connect to M-Pesa'));
      });

      req.end();
    });
  },

  generatePassword(shortCode, passkey, timestamp) {
    const str = shortCode + passkey + timestamp;
    return Buffer.from(str).toString('base64');
  },

  generateTimestamp() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  },

  async initiateSTKPush(phoneNumber, amount, orderReference, transactionDesc) {
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount < 1) {
      throw new Error('Invalid payment amount');
    }

    const token = await this.getAccessToken();
    const timestamp = this.generateTimestamp();
    const password = this.generatePassword(config.mpesa.shortCode, config.mpesa.passkey, timestamp);

    let cleanedPhone = String(phoneNumber).trim();
    if (cleanedPhone.startsWith('+')) {
      cleanedPhone = cleanedPhone.substring(1);
    }

    cleanedPhone = cleanedPhone.replace(/\D/g, '');

    if (cleanedPhone.startsWith('0')) {
      cleanedPhone = '254' + cleanedPhone.slice(1);
    }

    if (!/^2547\d{8}$/.test(cleanedPhone)) {
      throw new Error('Invalid Kenyan phone number');
    }

    const payload = {
      BusinessShortCode: config.mpesa.shortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(numericAmount),
      PartyA: cleanedPhone,
      PartyB: config.mpesa.tillNumber || config.mpesa.shortCode,
      PhoneNumber: cleanedPhone,
      CallBackURL: config.mpesa.callbackUrl,
      AccountReference: orderReference || 'DJStarMovies',
      TransactionDesc: transactionDesc || 'Movie Purchase',
    };

    const url = config.mpesa.environment === 'production'
      ? 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
      : 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';

    return new Promise((resolve, reject) => {
      const postData = JSON.stringify(payload);
      const parsedUrl = new URL(url);

      const options = {
        hostname: parsedUrl.hostname,
        path: parsedUrl.pathname,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            logger.info('M-Pesa STK Push response', {
              responseCode: parsed.ResponseCode,
              responseDescription: parsed.ResponseDescription,
              merchantRequestID: parsed.MerchantRequestID,
              checkoutRequestID: parsed.CheckoutRequestID,
            });
            resolve(parsed);
          } catch (err) {
            logger.error('M-Pesa STK Push parse error', { error: err.message, data });
            reject(new Error('Failed to parse M-Pesa response'));
          }
        });
      });

      req.on('error', (err) => {
        logger.error('M-Pesa STK Push request failed', { error: err.message });
        reject(new Error('Failed to initiate M-Pesa payment'));
      });

      req.write(postData);
      req.end();
    });
  },

  async querySTKStatus(checkoutRequestId) {
    const token = await this.getAccessToken();
    const timestamp = this.generateTimestamp();
    const password = this.generatePassword(config.mpesa.shortCode, config.mpesa.passkey, timestamp);

    const payload = {
      BusinessShortCode: config.mpesa.shortCode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId,
    };

    const url = config.mpesa.environment === 'production'
      ? 'https://api.safaricom.co.ke/mpesa/stkpushquery/v1/query'
      : 'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query';

    return new Promise((resolve, reject) => {
      const postData = JSON.stringify(payload);
      const parsedUrl = new URL(url);

      const options = {
        hostname: parsedUrl.hostname,
        path: parsedUrl.pathname,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve(parsed);
          } catch (err) {
            reject(new Error('Failed to parse M-Pesa query response'));
          }
        });
      });

      req.on('error', (err) => {
        logger.error('M-Pesa STK Query failed', { error: err.message });
        reject(new Error('Failed to query M-Pesa payment status'));
      });

      req.write(postData);
      req.end();
    });
  },

  verifyCallback(body) {
    if (!body || !body.Body || !body.Body.stkCallback) {
      return { valid: false, reason: 'Invalid callback structure' };
    }

    const callback = body.Body.stkCallback;
    const metadataItems = callback.CallbackMetadata?.Item || [];

    return {
      valid: true,
      merchantRequestID: callback.MerchantRequestID,
      checkoutRequestID: callback.CheckoutRequestID,
      resultCode: callback.ResultCode,
      resultDesc: callback.ResultDesc,
      amount: metadataItems.find(i => i.Name === 'Amount')?.Value,
      mpesaReceipt: metadataItems.find(i => i.Name === 'MpesaReceiptNumber')?.Value,
      phoneNumber: metadataItems.find(i => i.Name === 'PhoneNumber')?.Value,
      transactionDate: metadataItems.find(i => i.Name === 'TransactionDate')?.Value,
    };
  },

  verifyCallbackSignature(body, signature) {
    if (!config.mpesa.callbackSecret) {
      return false;
    }

    if (!body || typeof body !== 'object' || !signature) {
      return false;
    }

    const payload = JSON.stringify(body);
    const expectedSignature = crypto
      .createHmac('sha256', config.mpesa.callbackSecret)
      .update(payload)
      .digest('hex');

    try {
      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(signature, 'hex'),
      );
    } catch (err) {
      return false;
    }
  },
};

module.exports = mpesaService;
