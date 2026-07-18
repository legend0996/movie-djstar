const jwt = require('jsonwebtoken');
const config = require('../config');
const { ROLES, USER_STATUS } = require('../constants');
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
      if (err.name === 'JsonWebTokenError') {
        throw new UnauthorizedError('Invalid token');
      }
      throw new UnauthorizedError('Token verification failed');
    }

    const user = await userRepository.findById(decoded.sub);
    if (!user) {
      throw new UnauthorizedError('User no longer exists');
    }

    if (user.status === USER_STATUS.DELETED) {
      throw new UnauthorizedError('Account no longer exists');
    }

    if (user.status === USER_STATUS.SUSPENDED) {
      throw new ForbiddenError('Account is suspended. Contact support.');
    }

    if (user.status === USER_STATUS.DISABLED) {
      throw new ForbiddenError('Account is disabled');
    }

    req.user = {
      id: user.id,
      roleId: user.roleId,
      role: user.role?.slug || user.role?.name,
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

function verifiedUser(req, res, next) {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }
    if (req.user.status === USER_STATUS.UNVERIFIED) {
      throw new ForbiddenError('Email verification required');
    }
    next();
  } catch (err) {
    next(err);
  }
}

function activeUser(req, res, next) {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }
    if (req.user.status !== USER_STATUS.ACTIVE) {
      throw new ForbiddenError('Account is not active');
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

module.exports = { authenticate, authorize, verifiedUser, activeUser, optionalAuth };
