const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const config = Object.freeze({
  env: process.env.NODE_ENV || 'development',
  isDev: (process.env.NODE_ENV || 'development') === 'development',
  isProd: process.env.NODE_ENV === 'production',

  app: {
    name: process.env.APP_NAME || 'DJ Star Original Movies',
    url: process.env.APP_URL || 'http://localhost:5000',
    port: parseInt(process.env.PORT, 10) || 5000,
  },

  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    name: process.env.DB_NAME || 'dj_star_movies',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT, 10) || 10,
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'change_this_secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    issuer: process.env.JWT_ISSUER || 'DJStarOriginalMovies',
  },

  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.EMAIL_FROM || 'noreply@djstarmovies.com',
    fromName: process.env.EMAIL_FROM_NAME || 'DJ Star Original Movies',
  },

  r2: {
    endpoint: process.env.R2_ENDPOINT || '',
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    bucket: process.env.R2_BUCKET_NAME || 'dj-star-movies',
    publicUrl: process.env.R2_PUBLIC_URL || '',
    region: process.env.R2_REGION || 'auto',
  },

  mpesa: {
    consumerKey: process.env.MPESA_CONSUMER_KEY || '',
    consumerSecret: process.env.MPESA_CONSUMER_SECRET || '',
    passkey: process.env.MPESA_PASSKEY || '',
    shortCode: process.env.MPESA_SHORTCODE || '',
    environment: process.env.MPESA_ENVIRONMENT || 'sandbox',
    callbackUrl: process.env.MPESA_CALLBACK_URL || '',
    timeoutUrl: process.env.MPESA_TIMEOUT_URL || '',
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000,
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
    authMax: parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10) || 10,
    uploadMax: parseInt(process.env.UPLOAD_RATE_LIMIT_MAX, 10) || 5,
  },

  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 5242880000,
    tempDir: process.env.UPLOAD_TEMP_DIR || './temp',
  },

  stream: {
    chunkSize: parseInt(process.env.STREAM_CHUNK_SIZE, 10) || 8388608,
  },

  security: {
    bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12,
    verificationCodeExpiryMinutes: parseInt(process.env.VERIFICATION_CODE_EXPIRY_MINUTES, 10) || 15,
    passwordResetExpiryMinutes: parseInt(process.env.PASSWORD_RESET_EXPIRY_MINUTES, 10) || 15,
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS, 10) || 5,
    loginLockoutMinutes: parseInt(process.env.LOGIN_LOCKOUT_MINUTES, 10) || 30,
  },

  commission: {
    developerPercentage: parseInt(process.env.DEVELOPER_COMMISSION_PERCENTAGE, 10) || 40,
  },

  logging: {
    level: process.env.LOG_LEVEL || 'debug',
    dir: process.env.LOG_DIR || './logs',
  },

  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },

  jobs: {
    cleanupSchedule: process.env.CLEANUP_SCHEDULE || '0 */6 * * *',
  },
});

module.exports = config;
