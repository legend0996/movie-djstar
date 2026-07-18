const config = require('../config');

function xssProtection(req, res, next) {
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
}

function noSniff(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
}

function frameGuard(req, res, next) {
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  next();
}

function hsts(req, res, next) {
  if (config.isProd) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  next();
}

module.exports = { xssProtection, noSniff, frameGuard, hsts };
