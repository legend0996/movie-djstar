const jwt = require('jsonwebtoken');
const config = require('../config');
const db = require('../config/database');
const { UnauthorizedError, ForbiddenError } = require('../utils/errors');
const userRepository = require('../repositories/userRepository');

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Authentication required');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedError('Invalid token format');
    }

    let decoded;
    try {
      decoded = jwt.verify(token, config.jwt.secret, {
        issuer: config.jwt.issuer,
      });
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw new UnauthorizedError('Token has expired');
      }
      throw new UnauthorizedError('Invalid token');
    }

    const [sessions] = await db.execute(
      `SELECT id FROM user_sessions
       WHERE user_id = ? AND token = ? AND is_active = 1 AND revoked_at IS NULL AND expires_at > NOW()`,
      [decoded.sub, token]
    );

    if (!sessions.length) {
      throw new UnauthorizedError('Session expired or revoked');
    }

    const user = await userRepository.findById(decoded.sub);
    if (!user) {
      throw new UnauthorizedError('User no longer exists');
    }

    if (user.status !== 'active' && user.status !== 'unverified') {
      if (user.status === 'suspended') {
        throw new ForbiddenError('Account is suspended. Contact support.');
      }
      if (user.status === 'disabled') {
        throw new ForbiddenError('Account is disabled');
      }
      if (user.status === 'deleted') {
        throw new UnauthorizedError('Account no longer exists');
      }
      throw new ForbiddenError('Account access restricted');
    }

    req.user = {
      id: user.id,
      roleId: user.role_id,
      role: user.role_name || user.role_slug,
      username: user.username,
      email: user.email,
      status: user.status,
    };
    next();
  } catch (err) {
    next(err);
  }
}

function authorize(...allowedRoles) {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }
      if (!allowedRoles.includes(req.user.role)) {
        throw new ForbiddenError('Insufficient permissions');
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

function requireVerifiedEmail(req, res, next) {
  try {
    if (req.user.status === 'unverified') {
      throw new ForbiddenError('Email verification required');
    }
    next();
  } catch (err) {
    next(err);
  }
}

function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }
  return authenticate(req, res, next);
}

module.exports = { authenticate, authorize, requireVerifiedEmail, optionalAuth };
