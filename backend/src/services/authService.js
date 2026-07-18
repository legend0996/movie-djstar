const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config');
const db = require('../config/database');
const userRepository = require('../repositories/userRepository');
const roleRepository = require('../repositories/roleRepository');
const notificationService = require('./notificationService');
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
const { ROLES, USER_STATUS, VERIFICATION_TYPE } = require('../constants');
const logger = require('../utils/logger');

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

    const userRole = await roleRepository.findBySlug(ROLES.USER);
    if (!userRole) {
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
      roleId: userRole.id,
    });

    const verificationCode = await this.generateVerificationCode(userId, VERIFICATION_TYPE.EMAIL);

    try {
      await emailService.sendVerificationCode(email, verificationCode, username);
    } catch (err) {
      logger.error('Failed to send verification email', { error: err.message, userId, email });
    }

    await logActivity(userId, 'registration', 'user', userId, { username, email });

    const result = { userId };
    if (config.isDev) {
      result.verificationCode = verificationCode;
    }
    return result;
  },

  async loginStep1(identifier) {
    let user = await userRepository.findByUsername(identifier);
    if (!user) {user = await userRepository.findByEmail(identifier);}
    if (!user) {
      return { exists: false };
    }

    if (user.status === USER_STATUS.SUSPENDED) {
      throw new ForbiddenError('Account is suspended. Contact support.');
    }
    if (user.status === USER_STATUS.DISABLED) {
      throw new ForbiddenError('Account is disabled');
    }
    if (user.status === USER_STATUS.DELETED) {
      return { exists: false };
    }

    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      const minutesRemaining = Math.ceil((new Date(user.lockedUntil) - new Date()) / 60000);
      throw new TooManyRequestsError(`Account is locked. Try again in ${minutesRemaining} minutes.`);
    }

    return { exists: true, status: user.status };
  },

  async loginStep2(identifier, password) {
    let user = await userRepository.findByUsername(identifier);
    if (!user) {user = await userRepository.findByEmail(identifier);}
    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      throw new TooManyRequestsError('Account is temporarily locked. Try again later.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      await userRepository.incrementLoginAttempts(user.id);

      if (user.loginAttempts + 1 >= config.security.maxLoginAttempts) {
        const lockUntil = new Date(Date.now() + config.security.loginLockoutMinutes * 60000);
        await userRepository.lockAccount(user.id, lockUntil);
        await logActivity(user.id, 'account_locked', 'user', user.id, {
          reason: 'Too many failed login attempts',
          attempts: user.loginAttempts + 1,
        });
        throw new TooManyRequestsError('Account locked due to too many failed attempts. Try again later.');
      }

      await logActivity(user.id, 'failed_login', 'user', user.id, { ip: null });
      throw new UnauthorizedError('Invalid credentials');
    }

    await userRepository.resetLoginAttempts(user.id);
    await userRepository.update(user.id, {
      lastLoginAt: new Date(),
      lastLoginIp: null,
    });

    const tokens = this.generateTokens(user);

    await db.execute(
      `INSERT INTO user_sessions (user_id, token, refresh_token, ip_address, user_agent, expires_at)
       VALUES (?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))`,
      [user.id, tokens.accessToken, tokens.refreshToken, null, null],
    );

    await logActivity(user.id, 'login', 'user', user.id);

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role?.slug,
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

    if (user.emailVerifiedAt) {
      throw new ValidationError('Email is already verified');
    }

    const [codes] = await db.query(
      `SELECT * FROM verification_codes
       WHERE user_id = ? AND code = ? AND type = ?
         AND used_at IS NULL AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [user.id, code, VERIFICATION_TYPE.EMAIL],
    );

    const verification = codes?.[0];
    if (!verification) {
      throw new ValidationError('Invalid or expired verification code');
    }

    await db.execute(
      'UPDATE verification_codes SET used_at = NOW() WHERE id = ?',
      [verification.id],
    );

    await userRepository.update(user.id, {
      status: USER_STATUS.ACTIVE,
      emailVerifiedAt: new Date(),
    });

    await logActivity(user.id, 'email_verified', 'user', user.id, { email });

    try {
      await emailService.sendWelcomeEmail(user.email, user.username);
    } catch (err) {
      logger.error('Failed to send welcome email', { error: err.message, userId: user.id });
    }

    const tokens = this.generateTokens(user);
    return {
      tokens,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role?.slug,
        status: USER_STATUS.ACTIVE,
      },
    };
  },

  async resendVerificationCode(email) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      return { message: 'If the email exists, a verification code has been sent.' };
    }

    if (user.emailVerifiedAt) {
      return { message: 'Email is already verified.' };
    }

    const code = await this.generateVerificationCode(user.id, VERIFICATION_TYPE.EMAIL);

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

    const code = await this.generateVerificationCode(user.id, VERIFICATION_TYPE.PASSWORD_RESET);

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

    const [codes] = await db.query(
      `SELECT * FROM verification_codes
       WHERE user_id = ? AND code = ? AND type = ?
         AND used_at IS NULL AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [user.id, code, VERIFICATION_TYPE.PASSWORD_RESET],
    );

    const verification = codes?.[0];
    if (!verification) {
      throw new ValidationError('Invalid or expired reset code');
    }

    if (verification.attempts >= verification.maxAttempts) {
      throw new ValidationError('Too many attempts. Request a new reset code.');
    }

    await db.execute(
      'UPDATE verification_codes SET used_at = NOW() WHERE id = ?',
      [verification.id],
    );

    await db.execute(
      `UPDATE verification_codes SET used_at = NOW()
       WHERE user_id = ? AND type = ? AND used_at IS NULL`,
      [user.id, VERIFICATION_TYPE.PASSWORD_RESET],
    );

    const passwordHash = await bcrypt.hash(newPassword, config.security.bcryptSaltRounds);
    await userRepository.update(user.id, {
      passwordHash,
      passwordChangedAt: new Date(),
    });

    await db.execute(
      `UPDATE user_sessions SET is_active = 0, revoked_at = NOW()
       WHERE user_id = ? AND is_active = 1`,
      [user.id],
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
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      throw new ValidationError('Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(newPassword, config.security.bcryptSaltRounds);
    await userRepository.update(userId, {
      passwordHash,
      passwordChangedAt: new Date(),
    });

    await db.execute(
      `UPDATE user_sessions SET is_active = 0, revoked_at = NOW()
       WHERE user_id = ? AND is_active = 1`,
      [userId],
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
      [userId, token],
    );
    await logActivity(userId, 'logout', 'user', userId);
    return { message: 'Logged out successfully.' };
  },

  async getProfile(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    const libraryRepository = require('../repositories/libraryRepository');
    const libraryCount = await libraryRepository.getLibraryCount(userId);
    const [orderStats] = await db.query(
      `SELECT COUNT(*) as total_purchases,
              COALESCE(SUM(total_amount), 0) as total_spent
       FROM orders WHERE user_id = ? AND payment_status = 'paid'`,
      [userId],
    );

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      role: user.role?.slug,
      roleName: user.role?.name,
      status: user.status,
      isVerified: user.status === 'active',
      emailVerifiedAt: user.emailVerifiedAt,
      lastLoginAt: user.lastLoginAt,
      libraryCount,
      totalPurchases: orderStats[0]?.total_purchases || 0,
      totalSpent: Number(orderStats[0]?.total_spent) || 0,
      createdAt: user.createdAt,
    };
  },

  async updateProfile(userId, data) {
    const updates = {};
    if (data.firstName !== undefined) {updates.firstName = data.firstName;}
    if (data.lastName !== undefined) {updates.lastName = data.lastName;}
    if (data.phone !== undefined) {updates.phone = parsePhoneNumber(data.phone);}
    if (data.avatarUrl !== undefined) {updates.avatarUrl = data.avatarUrl;}

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
      [userId, type],
    );

    const code = generateVerificationCode();
    const expiryMinutes = type === VERIFICATION_TYPE.PASSWORD_RESET
      ? config.security.passwordResetExpiryMinutes
      : config.security.verificationCodeExpiryMinutes;
    const expiresAt = new Date(Date.now() + expiryMinutes * 60000);

    await db.execute(
      `INSERT INTO verification_codes (user_id, code, type, expires_at)
       VALUES (?, ?, ?, ?)`,
      [userId, code, type, expiresAt],
    );

    return code;
  },

  generateTokens(user) {
    const accessToken = jwt.sign(
      {
        sub: user.id,
        username: user.username,
        role: user.role?.slug,
      },
      config.jwt.secret,
      {
        expiresIn: config.jwt.expiresIn,
        issuer: config.jwt.issuer,
        jwtid: crypto.randomUUID(),
      },
    );

    const refreshToken = jwt.sign(
      { sub: user.id, type: 'refresh' },
      config.jwt.secret,
      {
        expiresIn: config.jwt.refreshExpiresIn,
        issuer: config.jwt.issuer,
        jwtid: crypto.randomUUID(),
      },
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

      const [sessions] = await db.query(
        'SELECT * FROM user_sessions WHERE refresh_token = ? AND is_active = 1 AND revoked_at IS NULL',
        [refreshToken],
      );

      if (!sessions?.length) {
        throw new UnauthorizedError('Session expired or revoked');
      }

      const user = await userRepository.findById(decoded.sub);
      if (!user || user.status === USER_STATUS.DELETED || user.status === USER_STATUS.SUSPENDED) {
        throw new UnauthorizedError('Account access restricted');
      }

      const tokens = this.generateTokens(user);

      await db.execute(
        `UPDATE user_sessions SET token = ?, refresh_token = ?, expires_at = DATE_ADD(NOW(), INTERVAL 7 DAY)
         WHERE id = ?`,
        [tokens.accessToken, tokens.refreshToken, sessions[0].id],
      );

      return tokens;
    } catch (err) {
      if (err instanceof UnauthorizedError) {throw err;}
      throw new UnauthorizedError('Invalid or expired refresh token');
    }
  },
};

module.exports = authService;
