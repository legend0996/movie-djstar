const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { initiatePurchaseSchema } = require('../validators/paymentValidators');

router.post('/mpesa-callback', paymentController.mpesaCallback);
router.post('/mpesa-timeout', paymentController.mpesaTimeout);

router.use(authenticate);
router.post('/purchase', validate(initiatePurchaseSchema), paymentController.initiatePurchase);
router.get('/status/:checkoutRequestId', paymentController.queryPaymentStatus);
router.get('/history', paymentController.getPurchaseHistory);
router.get('/orders/:id', paymentController.getOrderDetails);
router.get('/receipts', paymentController.getReceipts);
router.get('/receipts/:id', paymentController.getReceiptById);

module.exports = router;
