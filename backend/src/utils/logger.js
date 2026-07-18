const winston = require('winston');
const path = require('path');
const fs = require('fs');
const config = require('../config');

const logDir = path.resolve(config.logging.dir);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const jsonFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const rest = Object.keys(meta).length > 1 ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} ${level}: ${message}${rest}`;
  }),
);

const fileTransportOptions = {
  maxsize: 10485760,
  maxFiles: 10,
  format: jsonFormat,
};

const logger = winston.createLogger({
  level: config.logging.level,
  format: jsonFormat,
  defaultMeta: { service: 'dj-star-movies' },
  transports: [
    new winston.transports.File({
      ...fileTransportOptions,
      filename: path.join(logDir, 'error.log'),
      level: 'error',
    }),
    new winston.transports.File({
      ...fileTransportOptions,
      filename: path.join(logDir, 'combined.log'),
    }),
  ],
});

if (config.isDev) {
  logger.add(new winston.transports.Console({ format: consoleFormat }));
}

const auditLogger = winston.createLogger({
  level: 'warn',
  format: jsonFormat,
  defaultMeta: { service: 'dj-star-movies', type: 'audit' },
  transports: [
    new winston.transports.File({
      ...fileTransportOptions,
      filename: path.join(logDir, 'auth.log'),
      level: 'warn',
    }),
  ],
});

if (config.isDev) {
  auditLogger.add(new winston.transports.Console({ format: consoleFormat }));
}

const paymentLogger = winston.createLogger({
  level: 'info',
  format: jsonFormat,
  defaultMeta: { service: 'dj-star-movies', type: 'payment' },
  transports: [
    new winston.transports.File({
      ...fileTransportOptions,
      filename: path.join(logDir, 'payments.log'),
    }),
  ],
});

if (config.isDev) {
  paymentLogger.add(new winston.transports.Console({ format: consoleFormat }));
}

module.exports = logger;
module.exports.auditLogger = auditLogger;
module.exports.paymentLogger = paymentLogger;
