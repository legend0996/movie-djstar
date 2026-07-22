const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config');
const userRepository = require('../repositories/userRepository');
const emailService = require('./emailService');
const { logActivity } = require('../middleware/activityLogger');
const { generateVerificationCode, parsePhoneNumber } = require('../utils/helpers');
const {
  ConflictError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
  TooManyRequestsError,
} = require('../utils/errors');
const logger = require('../utils/logger');
const db = require('../config/database');

const authService = {
  async register({ username, email, phone, password, firstName, lastName }) {
    const existingUsername = await userRepository.findByUsername(username);
    if (existingUsername) {
      throw new ConflictError('Username is already taken');
    }

    const existingEmail = await userRepository.findByEmail(email);
    if (existingEmail) {
      throw new ConflictError('Email is already registered');
    }

    if (phone) {
      const parsedPhone = parsePhoneNumber(phone);
      const existingPhone = await userRepository.findByPhone(parsedPhone);
      if (existingPhone) {
        throw new ConflictError('Phone number is already registered');
      }
    }

    const [userRole] = await db.execute(`SELECT id FROM roles WHERE slug = 'user'`);
    if (!userRole.length) {
      throw new Error('Default user role not found');
    }

    const passwordHash = await bcrypt.hash(password, config.security.bcryptSaltRounds);
    const userId = await userRepository.create({
      username,
      email,
      phone: phone ? parsePhoneNumber(phone) : null,
      passwordHash,
      firstName,
      lastName,
      roleId: userRole[0].id,
    });

    const verificationCode = await this.generateVerificationCode(userId, 'email_verification');

    try {
      await emailService.sendVerificationCode(email, verificationCode, username);
    } catch (err) {
      logger.error('Failed to send verification email', { error: err.message, userId, email });
    }

    await logActivity(userId, 'registration', 'user', userId, { username, email });

    return { userId };
  },

  async loginStep1(username) {
    const user = await userRepository.findByUsername(username);
    if (!user) {
      return { exists: false };
    }

    if (user.status === 'suspended') {
      throw new ForbiddenError('Account is suspended. Contact support.');
    }
    if (user.status === 'disabled') {
      throw new ForbiddenError('Account is disabled');
    }
    if (user.status === 'deleted') {
      return { exists: false };
    }

    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const minutesRemaining = Math.ceil((new Date(user.locked_until) - new Date()) / 60000);
      throw new TooManyRequestsError(`Account is locked. Try again in ${minutesRemaining} minutes.`);
    }

    return { exists: true, status: user.status };
  },

  async loginStep2(username, password) {
    const user = await userRepository.findByUsername(username);
    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      throw new TooManyRequestsError('Account is temporarily locked. Try again later.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      await userRepository.incrementLoginAttempts(user.id);

      if (user.login_attempts + 1 >= config.security.maxLoginAttempts) {
        const lockUntil = new Date(Date.now() + config.security.loginLockoutMinutes * 60000);
        await userRepository.lockAccount(user.id, lockUntil);
        await logActivity(user.id, 'account_locked', 'user', user.id, {
          reason: 'Too many failed login attempts',
          attempts: user.login_attempts + 1,
        });
        throw new TooManyRequestsError('Account locked due to too many failed attempts. Try again later.');
      }

      await logActivity(user.id, 'failed_login', 'user', user.id, { ip: null });
      throw new UnauthorizedError('Invalid credentials');
    }

    await userRepository.resetLoginAttempts(user.id);
    await userRepository.update(user.id, {
      last_login_at: new Date(),
      last_login_ip: null,
    });

    const tokens = this.generateTokens(user);

    await db.execute(
      `INSERT INTO user_sessions (user_id, token, refresh_token, ip_address, user_agent, expires_at)
       VALUES (?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))`,
      [user.id, tokens.accessToken, tokens.refreshToken, null, null]
    );

    await logActivity(user.id, 'login', 'user', user.id);

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role_slug,
        status: user.status,
      },
      tokens,
    };
  },

  async verifyEmail(email, code) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.email_verified_at) {
      throw new ValidationError('Email is already verified');
    }

    const [codes] = await db.execute(
      `SELECT * FROM verification_codes
       WHERE user_id = ? AND code = ? AND type = 'email_verification'
         AND used_at IS NULL AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [user.id, code]
    );

    if (!codes.length) {
      throw new ValidationError('Invalid or expired verification code');
    }

    const verification = codes[0];

    if (verification.attempts >= verification.max_attempts) {
      throw new ValidationError('Too many verification attempts. Request a new code.');
    }

    await db.execute(
      `UPDATE verification_codes SET used_at = NOW() WHERE id = ?`,
      [verification.id]
    );

    await userRepository.update(user.id, {
      status: 'active',
      email_verified_at: new Date(),
    });

    await logActivity(user.id, 'email_verified', 'user', user.id, { email });

    try {
      await emailService.sendWelcomeEmail(user.email, user.username);
    } catch (err) {
      logger.error('Failed to send welcome email', { error: err.message, userId: user.id });
    }

    const tokens = this.generateTokens(user);
    return { ...tokens, user: { id: user.id, username: user.username, email: user.email, role: user.role_slug, status: 'active' } };
  },

  async resendVerificationCode(email) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      return { message: 'If the email exists, a verification code has been sent.' };
    }

    if (user.email_verified_at) {
      return { message: 'Email is already verified.' };
    }

    const code = await this.generateVerificationCode(user.id, 'email_verification');

    try {
      await emailService.sendVerificationCode(user.email, code, user.username);
    } catch (err) {
      logger.error('Failed to resend verification email', { error: err.message, userId: user.id });
      throw new Error('Failed to send verification email. Please try again.');
    }

    return { message: 'Verification code sent successfully.' };
  },

  async forgotPassword(email) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      return { message: 'If the email exists, a password reset code has been sent.' };
    }

    const code = await this.generateVerificationCode(user.id, 'password_reset');

    try {
      await emailService.sendPasswordResetCode(user.email, code, user.username);
    } catch (err) {
      logger.error('Failed to send password reset email', { error: err.message, userId: user.id });
      throw new Error('Failed to send reset code. Please try again.');
    }

    return { message: 'Password reset code sent successfully.' };
  },

  async resetPassword(email, code, newPassword) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const [codes] = await db.execute(
      `SELECT * FROM verification_codes
       WHERE user_id = ? AND code = ? AND type = 'password_reset'
         AND used_at IS NULL AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [user.id, code]
    );

    if (!codes.length) {
      throw new ValidationError('Invalid or expired reset code');
    }

    const verification = codes[0];

    if (verification.attempts >= verification.max_attempts) {
      throw new ValidationError('Too many attempts. Request a new reset code.');
    }

    await db.execute(
      `UPDATE verification_codes SET used_at = NOW() WHERE id = ?`,
      [verification.id]
    );

    await db.execute(
      `UPDATE verification_codes SET used_at = NOW()
       WHERE user_id = ? AND type = 'password_reset' AND used_at IS NULL`,
      [user.id]
    );

    const passwordHash = await bcrypt.hash(newPassword, config.security.bcryptSaltRounds);
    await userRepository.update(user.id, {
      password_hash: passwordHash,
      password_changed_at: new Date(),
    });

    await db.execute(
      `UPDATE user_sessions SET is_active = 0, revoked_at = NOW()
       WHERE user_id = ? AND is_active = 1`,
      [user.id]
    );

    await logActivity(user.id, 'password_reset', 'user', user.id);

    try {
      await emailService.sendPasswordChangeConfirmation(user.email, user.username);
    } catch (err) {
      logger.error('Failed to send password change confirmation', { error: err.message, userId: user.id });
    }

    return { message: 'Password reset successfully.' };
  },

  async changePassword(userId, currentPassword, newPassword) {
    const [users] = await db.execute(`SELECT * FROM users WHERE id = ?`, [userId]);
    const user = users[0];
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isPasswordValid) {
      throw new ValidationError('Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(newPassword, config.security.bcryptSaltRounds);
    await userRepository.update(userId, {
      password_hash: passwordHash,
      password_changed_at: new Date(),
    });

    await db.execute(
      `UPDATE user_sessions SET is_active = 0, revoked_at = NOW()
       WHERE user_id = ? AND is_active = 1`,
      [userId]
    );

    await logActivity(userId, 'password_changed', 'user', userId);

    try {
      await emailService.sendPasswordChangeConfirmation(user.email, user.username);
    } catch (err) {
      logger.error('Failed to send password change email', { error: err.message, userId });
    }

    return { message: 'Password changed successfully.' };
  },

  async logout(userId, token) {
    await db.execute(
      `UPDATE user_sessions SET is_active = 0, revoked_at = NOW()
       WHERE user_id = ? AND token = ?`,
      [userId, token]
    );
    await logActivity(userId, 'logout', 'user', userId);
    return { message: 'Logged out successfully.' };
  },

  async getProfile(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    const libraryCount = await require('../repositories/libraryRepository').getLibraryCount(userId);
    const [orderStats] = await db.execute(
      `SELECT COUNT(*) as total_purchases,
              COALESCE(SUM(total_amount), 0) as total_spent
       FROM orders WHERE user_id = ? AND payment_status = 'paid'`,
      [userId]
    );

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      firstName: user.first_name,
      lastName: user.last_name,
      avatarUrl: user.avatar_url,
      role: user.role_slug,
      roleName: user.role_name,
      status: user.status,
      emailVerifiedAt: user.email_verified_at,
      lastLoginAt: user.last_login_at,
      libraryCount,
      totalPurchases: orderStats[0].total_purchases,
      totalSpent: orderStats[0].total_spent,
      createdAt: user.created_at,
    };
  },

  async updateProfile(userId, data) {
    const updates = {};
    if (data.firstName !== undefined) updates.first_name = data.firstName;
    if (data.lastName !== undefined) updates.last_name = data.lastName;
    if (data.phone !== undefined) updates.phone = parsePhoneNumber(data.phone);
    if (data.avatarUrl !== undefined) updates.avatar_url = data.avatarUrl;

    if (Object.keys(updates).length === 0) {
      return { message: 'No changes to update.' };
    }

    await userRepository.update(userId, updates);
    await logActivity(userId, 'profile_updated', 'user', userId, data);

    return this.getProfile(userId);
  },

  async generateVerificationCode(userId, type) {
    await db.execute(
      `UPDATE verification_codes SET used_at = NOW()
       WHERE user_id = ? AND type = ? AND used_at IS NULL`,
      [userId, type]
    );

    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + config.security.verificationCodeExpiryMinutes * 60000);

    await db.execute(
      `INSERT INTO verification_codes (user_id, code, type, expires_at)
       VALUES (?, ?, ?, ?)`,
      [userId, code, type, expiresAt]
    );

    return code;
  },

  generateTokens(user) {
    const accessToken = jwt.sign(
      {
        sub: user.id,
        username: user.username,
        role: user.role_slug,
      },
      config.jwt.secret,
      {
        expiresIn: config.jwt.expiresIn,
        issuer: config.jwt.issuer,
        jwtid: crypto.randomUUID(),
      }
    );

    const refreshToken = jwt.sign(
      { sub: user.id, type: 'refresh' },
      config.jwt.secret,
      {
        expiresIn: config.jwt.refreshExpiresIn,
        issuer: config.jwt.issuer,
        jwtid: crypto.randomUUID(),
      }
    );

    return { accessToken, refreshToken };
  },

  async refreshAccessToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.secret, {
        issuer: config.jwt.issuer,
      });

      if (decoded.type !== 'refresh') {
        throw new UnauthorizedError('Invalid refresh token');
      }

      const [sessions] = await db.execute(
        `SELECT * FROM user_sessions WHERE refresh_token = ? AND is_active = 1 AND revoked_at IS NULL`,
        [refreshToken]
      );

      if (!sessions.length) {
        throw new UnauthorizedError('Session expired or revoked');
      }

      const user = await userRepository.findById(decoded.sub);
      if (!user || user.status === 'deleted' || user.status === 'suspended') {
        throw new UnauthorizedError('Account access restricted');
      }

      const tokens = this.generateTokens(user);

      await db.execute(
        `UPDATE user_sessions SET token = ?, refresh_token = ?, expires_at = DATE_ADD(NOW(), INTERVAL 7 DAY), is_active = 1, revoked_at = NULL
         WHERE id = ?`,
        [tokens.accessToken, tokens.refreshToken, sessions[0].id]
      );

      return tokens;
    } catch (err) {
      if (err instanceof UnauthorizedError) throw err;
      throw new UnauthorizedError('Invalid or expired refresh token');
    }
  },
};

module.exports = authService;
