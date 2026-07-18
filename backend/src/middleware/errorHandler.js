const logger = require('../utils/logger');
const config = require('../config');
const { AppError, ValidationError } = require('../utils/errors');

function errorHandler(err, req, res, _next) {
  const logMeta = {
    path: req.originalUrl,
    method: req.method,
    userId: req.user?.id || null,
  };

  if (err instanceof AppError) {
    logger.warn(`${err.errorCode}: ${err.message}`, { ...logMeta, statusCode: err.statusCode, errorCode: err.errorCode });
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errorCode: err.errorCode,
      details: err.details || null,
    });
  }

  if (err.isJoi) {
    const details = err.details.map(d => ({
      field: d.path.join('.'),
      message: d.message.replace(/"/g, ''),
    }));
    logger.warn('ValidationError', { ...logMeta, details });
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errorCode: 'VALIDATION_ERROR',
      details,
    });
  }

  if (err.name === 'MulterError') {
    const multerMessages = {
      LIMIT_FILE_SIZE: 'File size exceeds the maximum allowed size',
      LIMIT_FILE_COUNT: 'Too many files uploaded',
      LIMIT_UNEXPECTED_FILE: 'Unexpected file field',
      LIMIT_FIELD_KEY: 'Field name too long',
      LIMIT_FIELD_VALUE: 'Field value too long',
      LIMIT_FIELD_COUNT: 'Too many fields',
      LIMIT_PART_COUNT: 'Too many parts',
    };
    const message = multerMessages[err.code] || `Upload error: ${err.message}`;
    logger.warn(`MulterError: ${err.code}`, { ...logMeta, field: err.field });
    return res.status(400).json({
      success: false,
      message,
      errorCode: 'UPLOAD_ERROR',
      details: [{ field: err.field, message }],
    });
  }

  if (err.code && err.code.startsWith('ER_DUP_ENTRY')) {
    logger.warn('Database unique constraint violation', { ...logMeta, sqlMessage: err.sqlMessage });
    return res.status(409).json({
      success: false,
      message: 'Resource already exists',
      errorCode: 'CONFLICT',
      details: null,
    });
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_ROW_IS_REFERENCED_2') {
    logger.warn('Database foreign key violation', { ...logMeta, sqlMessage: err.sqlMessage });
    return res.status(409).json({
      success: false,
      message: 'Operation conflicts with existing data',
      errorCode: 'CONFLICT',
      details: null,
    });
  }

  if (err.type === 'entity.parse.failed') {
    logger.warn('Invalid JSON body', logMeta);
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON in request body',
      errorCode: 'INVALID_JSON',
      details: null,
    });
  }

  logger.error('Unhandled error', { ...logMeta, error: err.message, stack: config.isDev ? err.stack : undefined });

  return res.status(500).json({
    success: false,
    message: config.isDev ? err.message : 'Internal server error',
    errorCode: 'INTERNAL_ERROR',
    details: null,
  });
}

module.exports = errorHandler;
