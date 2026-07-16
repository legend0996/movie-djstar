const winston = require('winston');
const path = require('path');
const fs = require('fs');
const config = require('../config');

if (!fs.existsSync(config.logging.dir)) {
  fs.mkdirSync(config.logging.dir, { recursive: true });
}

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
    return `${timestamp} ${level}: ${message} ${metaStr}`;
  })
);

const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  defaultMeta: { service: 'dj-star-movies' },
  transports: [
    new winston.transports.File({
      filename: path.join(config.logging.dir, 'error.log'),
      level: 'error',
      maxsize: 10485760,
      maxFiles: 10,
    }),
    new winston.transports.File({
      filename: path.join(config.logging.dir, 'combined.log'),
      maxsize: 10485760,
      maxFiles: 10,
    }),
    new winston.transports.File({
      filename: path.join(config.logging.dir, 'auth.log'),
      level: 'warn',
      maxsize: 5242880,
      maxFiles: 5,
    }),
  ],
});

if (config.isDev || process.stdout.isTTY) {
  logger.add(new winston.transports.Console({ format: consoleFormat }));
}

module.exports = logger;
