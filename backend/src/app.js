require('dotenv').config();

if (typeof BigInt !== 'undefined' && !BigInt.prototype.toJSON) {
  BigInt.prototype.toJSON = function () {
    return Number(this);
  };
}

const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const config = require('./config');
const prisma = require('./config/database');
const { generalLimiter } = require('./middleware/rateLimiter');
const { sanitize } = require('./middleware/sanitize');
const { xssProtection, noSniff, frameGuard, hsts } = require('./middleware/security');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

const authRoutes = require('./routes/authRoutes');
const movieRoutes = require('./routes/movieRoutes');
const streamRoutes = require('./routes/streamRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const supportRoutes = require('./routes/supportRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));

app.use(require('./middleware/cors'));

app.use(compression());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (config.isDev) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: { write: (message) => logger.info(message.trim()) },
  }));
}

app.use(generalLimiter);

app.use(sanitize());

app.use(xssProtection);
app.use(noSniff);
app.use(frameGuard);
app.use(hsts);

app.get('/api/health', async (req, res) => {
  let dbStatus = 'healthy';
  let dbError = null;
  let uptime = process.uptime();

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (err) {
    dbStatus = 'unhealthy';
    dbError = config.isDev ? err.message : 'Database connection error';
  }

  res.json({
    success: true,
    message: 'DJ Star Original Movies API is running',
    timestamp: new Date().toISOString(),
    environment: config.env,
    uptime: `${Math.floor(uptime / 60)}m ${Math.floor(uptime % 60)}s`,
    database: dbStatus,
    ...(dbError ? { databaseError: dbError } : {}),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/stream', streamRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/notifications', notificationRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    errorCode: 'NOT_FOUND',
  });
});

app.use(errorHandler);

module.exports = app;
