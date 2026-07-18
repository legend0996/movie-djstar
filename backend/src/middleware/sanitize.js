const { ValidationError } = require('../utils/errors');

const STRIP_TAGS_REGEX = /<[^>]*>/g;
const NULL_BYTE_REGEX = /\0/g;

function sanitizeValue(value) {
  if (typeof value === 'string') {
    return value
      .replace(STRIP_TAGS_REGEX, '')
      .replace(NULL_BYTE_REGEX, '')
      .trim();
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value && typeof value === 'object') {
    return sanitizeObject(value);
  }
  return value;
}

function sanitizeObject(obj) {
  const sanitized = {};
  for (const [key, val] of Object.entries(obj)) {
    sanitized[key] = sanitizeValue(val);
  }
  return sanitized;
}

function sanitize(fields = null) {
  return (req, res, next) => {
    try {
      if (fields) {
        const fieldSet = new Set(fields);
        for (const source of ['body', 'query', 'params']) {
          if (req[source] && typeof req[source] === 'object') {
            for (const key of Object.keys(req[source])) {
              if (fieldSet.has(key)) {
                req[source][key] = sanitizeValue(req[source][key]);
              }
            }
          }
        }
      } else {
        if (req.body && typeof req.body === 'object') {
          req.body = sanitizeObject(req.body);
        }
        if (req.query && typeof req.query === 'object') {
          req.query = sanitizeObject(req.query);
        }
        if (req.params && typeof req.params === 'object') {
          req.params = sanitizeObject(req.params);
        }
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = { sanitize };
