const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { authLimiter, verificationLimiter } = require('../middleware/rateLimiter');
const {
  registerSchema,
  loginStep1Schema,
  loginStep2Schema,
  emailVerificationSchema,
  resendVerificationSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  updateProfileSchema,
} = require('../validators/authValidators');

router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login/step1', authLimiter, validate(loginStep1Schema), authController.loginStep1);
router.post('/login/step2', authLimiter, validate(loginStep2Schema), authController.loginStep2);
router.post('/verify-email', verificationLimiter, validate(emailVerificationSchema), authController.verifyEmail);
router.post('/resend-verification', verificationLimiter, validate(resendVerificationSchema), authController.resendVerification);
router.post('/forgot-password', verificationLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', verificationLimiter, validate(resetPasswordSchema), authController.resetPassword);
router.post('/refresh-token', authController.refreshToken);

router.use(authenticate);
router.post('/change-password', validate(changePasswordSchema), authController.changePassword);
router.post('/logout', authController.logout);
router.get('/profile', authController.getProfile);
router.put('/profile', validate(updateProfileSchema), authController.updateProfile);

module.exports = router;
