const crypto = require('crypto');

function generateVerificationCode(length = 6) {
  const digits = '0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += digits[crypto.randomInt(0, digits.length)];
  }
  return code;
}

function generateOrderNumber() {
  const prefix = 'DJ';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

function generateReceiptNumber() {
  const prefix = 'RCT';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

function generateTicketNumber() {
  const prefix = 'TKT';
  const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
  const random = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

function sanitizeString(str) {
  if (!str) return '';
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
  if (!phone) return null;
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.slice(1);
  } else if (cleaned.startsWith('+')) {
    cleaned = cleaned.slice(1);
  }
  if (cleaned.startsWith('254') && cleaned.length === 12) {
    return cleaned;
  }
  return cleaned;
}

function calculatePopularityScore(views, purchases, streams, downloads) {
  return (
    (views || 0) * 1 +
    (purchases || 0) * 10 +
    (streams || 0) * 3 +
    (downloads || 0) * 5
  );
}

function paginate(page = 1, limit = 20) {
  page = Math.max(1, parseInt(page, 10) || 1);
  limit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

function paginatedResponse(rows, total, page, limit) {
  return {
    data: rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
}

function generateUUID() {
  return crypto.randomUUID();
}

module.exports = {
  generateVerificationCode,
  generateOrderNumber,
  generateReceiptNumber,
  generateTicketNumber,
  sanitizeString,
  slugify,
  parsePhoneNumber,
  calculatePopularityScore,
  paginate,
  paginatedResponse,
  generateUUID,
};
