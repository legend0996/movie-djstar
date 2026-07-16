const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');
const response = require('../utils/response');

function errorHandler(err, req, res, _next) {
  if (err instanceof AppError) {
    const details = err.details || null;
    const publicDetails = details && details.public ? details.public : null;

    logger.warn(`${err.errorCode}: ${err.message}`, {
      path: req.originalUrl,
      method: req.method,
      errorCode: err.errorCode,
      statusCode: err.statusCode,
      ...(publicDetails ? { details: publicDetails } : {}),
    });

    return response.error(res, err.message, err.statusCode, err.errorCode, publicDetails ? { public: publicDetails } : null);
  }

  logger.error('Unhandled error', {
    path: req.originalUrl,
    method: req.method,
    error: err.message,
    stack: err.stack,
  });

  return response.error(
    res,
    process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    500,
    'INTERNAL_ERROR'
  );
}

module.exports = errorHandler;
