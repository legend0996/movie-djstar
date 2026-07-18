const {
  generateVerificationCode,
  slugify,
  parsePhoneNumber,
  sanitizeString,
  paginate,
  paginationMeta,
  generateOrderNumber,
} = require('../../../utils/helpers');

describe('generateVerificationCode()', () => {
  it('returns a 6-digit string', () => {
    const code = generateVerificationCode();
    expect(code).toMatch(/^\d{6}$/);
  });

  it('returns a string', () => {
    expect(typeof generateVerificationCode()).toBe('string');
  });
});

describe('slugify()', () => {
  it('converts to lowercase', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('replaces spaces with hyphens', () => {
    expect(slugify('hello world foo')).toBe('hello-world-foo');
  });

  it('strips special characters', () => {
    expect(slugify('hello@world!')).toBe('helloworld');
  });

  it('handles leading/trailing whitespace', () => {
    expect(slugify('  hello world  ')).toBe('hello-world');
  });

  it('collapses multiple hyphens', () => {
    expect(slugify('hello   world---foo')).toBe('hello-world-foo');
  });

  it('removes leading and trailing hyphens', () => {
    expect(slugify('--hello-world--')).toBe('hello-world');
  });
});

describe('parsePhoneNumber()', () => {
  it('normalizes Kenyan numbers starting with 0', () => {
    expect(parsePhoneNumber('0712345678')).toBe('254712345678');
  });

  it('normalizes Kenyan numbers with 254 prefix', () => {
    expect(parsePhoneNumber('254712345678')).toBe('254712345678');
  });

  it('normalizes numbers with +254', () => {
    expect(parsePhoneNumber('+254712345678')).toBe('254712345678');
  });

  it('returns null for empty', () => {
    expect(parsePhoneNumber(null)).toBeNull();
    expect(parsePhoneNumber('')).toBeNull();
  });

  it('strips non-numeric characters', () => {
    expect(parsePhoneNumber('+254 (712) 345-678')).toBe('254712345678');
  });
});

describe('sanitizeString()', () => {
  it('strips HTML tags', () => {
    expect(sanitizeString('<script>alert("xss")</script>')).toBe('alert("xss")');
  });

  it('trims whitespace', () => {
    expect(sanitizeString('  hello  ')).toBe('hello');
  });

  it('returns empty string for falsy input', () => {
    expect(sanitizeString(null)).toBe('');
    expect(sanitizeString(undefined)).toBe('');
    expect(sanitizeString('')).toBe('');
  });
});

describe('paginate()', () => {
  it('returns correct page, limit, offset', () => {
    const result = paginate(2, 10);
    expect(result).toEqual({ page: 2, limit: 10, offset: 10 });
  });

  it('defaults to page 1 if invalid', () => {
    const result = paginate(-1, 10);
    expect(result.page).toBe(1);
  });

  it('caps limit at MAX_LIMIT (100)', () => {
    const result = paginate(1, 200);
    expect(result.limit).toBe(100);
  });
});

describe('paginationMeta()', () => {
  it('returns hasNext=true when more pages exist', () => {
    const meta = paginationMeta(50, 1, 20);
    expect(meta.hasNext).toBe(true);
    expect(meta.hasPrev).toBe(false);
    expect(meta.totalPages).toBe(3);
    expect(meta.total).toBe(50);
  });

  it('returns hasPrev=true when not on first page', () => {
    const meta = paginationMeta(50, 2, 20);
    expect(meta.hasNext).toBe(true);
    expect(meta.hasPrev).toBe(true);
  });

  it('returns hasNext=false on last page', () => {
    const meta = paginationMeta(40, 2, 20);
    expect(meta.hasNext).toBe(false);
    expect(meta.hasPrev).toBe(true);
  });
});

describe('generateOrderNumber()', () => {
  it('returns format matching DJ-XXXX-XXXX', () => {
    const number = generateOrderNumber();
    expect(number).toMatch(/^DJ-[A-Z0-9]+-[A-F0-9]{6}$/);
  });
});
