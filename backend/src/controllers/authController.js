const authService = require('../services/authService');
const response = require('../utils/response');

const authController = {
  async register(req, res, next) {
    try {
      const result = await authService.register(req.body);
      return response.created(res, result, 'Registration successful. Please check your email for verification code.');
    } catch (err) {
      next(err);
    }
  },

  async loginStep1(req, res, next) {
    try {
      const result = await authService.loginStep1(req.body.username);
      return response.success(res, result);
    } catch (err) {
      next(err);
    }
  },

  async loginStep2(req, res, next) {
    try {
      const result = await authService.loginStep2(req.body.username, req.body.password);
      return response.success(res, result, 'Login successful');
    } catch (err) {
      next(err);
    }
  },

  async verifyEmail(req, res, next) {
    try {
      const result = await authService.verifyEmail(req.body.email, req.body.code);
      return response.success(res, result, 'Email verified successfully');
    } catch (err) {
      next(err);
    }
  },

  async resendVerification(req, res, next) {
    try {
      const result = await authService.resendVerificationCode(req.body.email);
      return response.success(res, result);
    } catch (err) {
      next(err);
    }
  },

  async forgotPassword(req, res, next) {
    try {
      const result = await authService.forgotPassword(req.body.email);
      return response.success(res, result);
    } catch (err) {
      next(err);
    }
  },

  async resetPassword(req, res, next) {
    try {
      const result = await authService.resetPassword(req.body.email, req.body.code, req.body.password);
      return response.success(res, result);
    } catch (err) {
      next(err);
    }
  },

  async changePassword(req, res, next) {
    try {
      const result = await authService.changePassword(req.user.id, req.body.currentPassword, req.body.newPassword);
      return response.success(res, result);
    } catch (err) {
      next(err);
    }
  },

  async logout(req, res, next) {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      const result = await authService.logout(req.user.id, token);
      return response.success(res, result);
    } catch (err) {
      next(err);
    }
  },

  async refreshToken(req, res, next) {
    try {
      const tokens = await authService.refreshAccessToken(req.body.refreshToken);
      return response.success(res, tokens, 'Token refreshed successfully');
    } catch (err) {
      next(err);
    }
  },

  async getProfile(req, res, next) {
    try {
      const profile = await authService.getProfile(req.user.id);
      return response.success(res, profile);
    } catch (err) {
      next(err);
    }
  },

  async updateProfile(req, res, next) {
    try {
      const result = await authService.updateProfile(req.user.id, req.body);
      return response.success(res, result, 'Profile updated successfully');
    } catch (err) {
      next(err);
    }
  },
};

module.exports = authController;
