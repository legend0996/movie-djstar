const crypto = require('crypto');
const { PAGINATION } = require('../constants');

function generateVerificationCode(length = 6) {
  const digits = '0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += digits[crypto.randomInt(0, digits.length)];
  }
  return code;
}

function generateOrderNumber() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `DJ-${ts}-${rand}`;
}

function generateReceiptNumber() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `RCT-${ts}-${rand}`;
}

function generateTicketNumber() {
  const ts = Date.now().toString(36).toUpperCase().slice(-4);
  const rand = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `TKT-${ts}-${rand}`;
}

function generateUUID() {
  return crypto.randomUUID();
}

function sanitizeString(str) {
  if (!str) {return '';}
  return str.replace(/<[^>]*>/g, '').trim();
}

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

function parsePhoneNumber(phone) {
  if (!phone) {return null;}
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.slice(1);
  }
  if (cleaned.startsWith('254') && cleaned.length >= 12) {
    return cleaned;
  }
  return cleaned;
}

function calculatePopularityScore(views = 0, purchases = 0, streams = 0, downloads = 0) {
  return views * 1 + purchases * 10 + streams * 3 + downloads * 5;
}

function paginate(page = PAGINATION.DEFAULT_PAGE, limit = PAGINATION.DEFAULT_LIMIT) {
  const p = Math.max(PAGINATION.DEFAULT_PAGE, parseInt(page, 10) || PAGINATION.DEFAULT_PAGE);
  const l = Math.min(PAGINATION.MAX_LIMIT, Math.max(1, parseInt(limit, 10) || PAGINATION.DEFAULT_LIMIT));
  return { page: p, limit: l, offset: (p - 1) * l };
}

function paginationMeta(total, page, limit) {
  const p = Math.max(PAGINATION.DEFAULT_PAGE, parseInt(page, 10) || PAGINATION.DEFAULT_PAGE);
  const l = Math.min(PAGINATION.MAX_LIMIT, Math.max(1, parseInt(limit, 10) || PAGINATION.DEFAULT_LIMIT));
  const totalPages = Math.ceil(total / l);
  return {
    page: p,
    limit: l,
    total,
    totalPages,
    hasNext: p * l < total,
    hasPrev: p > 1,
  };
}

async function generateUniqueSlug(baseSlug, checkFn, maxAttempts = 10) {
  let slug = baseSlug;
  for (let i = 1; i <= maxAttempts; i++) {
    const exists = await checkFn(slug);
    if (!exists) {return slug;}
    slug = `${baseSlug}-${i}`;
  }
  return `${baseSlug}-${Date.now()}`;
}

function maskEmail(email) {
  if (!email) {return '';}
  const atIndex = email.indexOf('@');
  if (atIndex <= 1) {return email;}
  return `${email[0]}****${email.slice(atIndex)}`;
}

function maskPhone(phone) {
  if (!phone) {return '';}
  const cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.length < 4) {return phone;}
  const last4 = cleaned.slice(-4);
  return `****${last4}`;
}

module.exports = {
  generateVerificationCode,
  generateOrderNumber,
  generateReceiptNumber,
  generateTicketNumber,
  generateUUID,
  sanitizeString,
  slugify,
  parsePhoneNumber,
  calculatePopularityScore,
  paginate,
  paginationMeta,
  generateUniqueSlug,
  maskEmail,
  maskPhone,
};
