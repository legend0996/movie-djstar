const dotenv = require('dotenv');
const path = require('path');
const Joi = require('joi');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  APP_NAME: Joi.string().default('DJ Star Original Movies'),
  APP_URL: Joi.string().uri({ allowRelative: true }).default('http://localhost:5000'),
  PORT: Joi.number().port().default(5000),

  DB_HOST: Joi.string().default('localhost'),
  DB_PORT: Joi.number().port().default(3306),
  DB_NAME: Joi.string().default('dj_star_movies'),
  DB_USER: Joi.string().default('root'),
  DB_PASSWORD: Joi.string().allow('').default(''),
  DB_CONNECTION_LIMIT: Joi.number().integer().min(1).default(10),

  JWT_SECRET: Joi.string().required().messages({
    'any.required': 'JWT_SECRET is a required environment variable',
  }),
  JWT_EXPIRES_IN: Joi.string().default('24h'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
  JWT_ISSUER: Joi.string().default('DJStarOriginalMovies'),

  SMTP_HOST: Joi.string().default('smtp.gmail.com'),
  SMTP_PORT: Joi.number().port().default(587),
  SMTP_SECURE: Joi.boolean().default(false),
  SMTP_USER: Joi.string().allow('').default(''),
  SMTP_PASS: Joi.string().allow('').default(''),
  EMAIL_FROM: Joi.string().email().default('noreply@djstarmovies.com'),
  EMAIL_FROM_NAME: Joi.string().default('DJ Star Original Movies'),

  R2_ENDPOINT: Joi.string().uri().allow('').default(''),
  R2_ACCESS_KEY_ID: Joi.string().allow('').default(''),
  R2_SECRET_ACCESS_KEY: Joi.string().allow('').default(''),
  R2_BUCKET_NAME: Joi.string().default('dj-star-movies'),
  R2_PUBLIC_URL: Joi.string().uri().allow('').default(''),
  R2_REGION: Joi.string().default('auto'),

  MPESA_CONSUMER_KEY: Joi.string().allow('').default(''),
  MPESA_CONSUMER_SECRET: Joi.string().allow('').default(''),
  MPESA_PASSKEY: Joi.string().allow('').default(''),
  MPESA_SHORTCODE: Joi.string().allow('').default(''),
  MPESA_ENVIRONMENT: Joi.string().valid('sandbox', 'production').default('sandbox'),
  MPESA_TILL_NUMBER: Joi.string().allow('').default(''),
  MPESA_CALLBACK_URL: Joi.string().uri().allow('').default(''),
  MPESA_TIMEOUT_URL: Joi.string().uri().allow('').default(''),

  RATE_LIMIT_WINDOW_MS: Joi.number().integer().min(1000).default(900000),
  RATE_LIMIT_MAX: Joi.number().integer().min(1).default(100),
  AUTH_RATE_LIMIT_MAX: Joi.number().integer().min(1).default(10),
  UPLOAD_RATE_LIMIT_MAX: Joi.number().integer().min(1).default(5),

  MAX_FILE_SIZE: Joi.number().integer().min(1).default(5242880000),
  UPLOAD_TEMP_DIR: Joi.string().default('./temp'),

  STREAM_CHUNK_SIZE: Joi.number().integer().min(1).default(8388608),

  BCRYPT_SALT_ROUNDS: Joi.number().integer().min(1).default(12),
  VERIFICATION_CODE_EXPIRY_MINUTES: Joi.number().integer().min(1).default(15),
  PASSWORD_RESET_EXPIRY_MINUTES: Joi.number().integer().min(1).default(15),
  MAX_LOGIN_ATTEMPTS: Joi.number().integer().min(1).default(5),
  LOGIN_LOCKOUT_MINUTES: Joi.number().integer().min(1).default(30),

  DEVELOPER_COMMISSION_PERCENTAGE: Joi.number().min(0).max(100).default(40),

  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('debug'),
  LOG_DIR: Joi.string().default('./logs'),

  CORS_ORIGIN: Joi.string().default('http://localhost:3002'),

  CLEANUP_SCHEDULE: Joi.string().default('0 */6 * * *'),

  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().port().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').default(''),
  REDIS_ENABLED: Joi.boolean().default(false),
});

function validateEnv() {
  const { error: validationError, value: env } = envSchema.validate(process.env, {
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: true,
  });

  if (validationError) {
    return {
      valid: false,
      errors: validationError.details.map(d => ({
        field: d.path.join('.'),
        message: d.message,
      })),
    };
  }

  return { valid: true, errors: null };
}

const { error: envError, value: env } = envSchema.validate(process.env, {
  abortEarly: true,
  allowUnknown: true,
  stripUnknown: true,
});

if (envError) {
  console.error('FATAL: Invalid environment configuration');
  console.error(envError.message);
  process.exit(1);
}

const config = Object.freeze({
  env: env.NODE_ENV,
  isDev: env.NODE_ENV === 'development',
  isProd: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',

  app: {
    name: env.APP_NAME,
    url: env.APP_URL,
    port: env.PORT,
  },

  db: {
    host: env.DB_HOST,
    port: env.DB_PORT,
    name: env.DB_NAME,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    connectionLimit: env.DB_CONNECTION_LIMIT,
  },

  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
    issuer: env.JWT_ISSUER,
  },

  email: {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
    from: env.EMAIL_FROM,
    fromName: env.EMAIL_FROM_NAME,
  },

  r2: {
    endpoint: env.R2_ENDPOINT,
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    bucket: env.R2_BUCKET_NAME,
    publicUrl: env.R2_PUBLIC_URL,
    region: env.R2_REGION,
  },

  mpesa: {
    consumerKey: env.MPESA_CONSUMER_KEY,
    consumerSecret: env.MPESA_CONSUMER_SECRET,
    passkey: env.MPESA_PASSKEY,
    shortCode: env.MPESA_SHORTCODE,
    tillNumber: env.MPESA_TILL_NUMBER || env.MPESA_SHORTCODE,
    environment: env.MPESA_ENVIRONMENT,
    callbackUrl: env.MPESA_CALLBACK_URL,
    timeoutUrl: env.MPESA_TIMEOUT_URL,
  },

  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
    authMax: env.AUTH_RATE_LIMIT_MAX,
    uploadMax: env.UPLOAD_RATE_LIMIT_MAX,
  },

  upload: {
    maxFileSize: env.MAX_FILE_SIZE,
    tempDir: env.UPLOAD_TEMP_DIR,
  },

  stream: {
    chunkSize: env.STREAM_CHUNK_SIZE,
  },

  security: {
    bcryptSaltRounds: env.BCRYPT_SALT_ROUNDS,
    verificationCodeExpiryMinutes: env.VERIFICATION_CODE_EXPIRY_MINUTES,
    passwordResetExpiryMinutes: env.PASSWORD_RESET_EXPIRY_MINUTES,
    maxLoginAttempts: env.MAX_LOGIN_ATTEMPTS,
    loginLockoutMinutes: env.LOGIN_LOCKOUT_MINUTES,
  },

  commission: {
    developerPercentage: env.DEVELOPER_COMMISSION_PERCENTAGE,
  },

  logging: {
    level: env.LOG_LEVEL,
    dir: env.LOG_DIR,
  },

  cors: {
    origin: env.CORS_ORIGIN,
  },

  jobs: {
    cleanupSchedule: env.CLEANUP_SCHEDULE,
  },

  redis: {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD,
    enabled: env.REDIS_ENABLED,
  },
});

module.exports = config;
module.exports.validateEnv = validateEnv;
