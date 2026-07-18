const {
  AppError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
  ConflictError,
  TooManyRequestsError,
  PaymentError,
  RateLimitError,
} = require('../../../utils/errors');

describe('AppError', () => {
  it('creates error with correct statusCode, errorCode, isOperational', () => {
    const err = new AppError('Test error', 400, 'TEST_ERROR', { foo: 'bar' });
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe('Test error');
    expect(err.statusCode).toBe(400);
    expect(err.errorCode).toBe('TEST_ERROR');
    expect(err.isOperational).toBe(true);
    expect(err.details).toEqual({ foo: 'bar' });
    expect(err.timestamp).toBeDefined();
  });

  it('uses defaults when no args provided', () => {
    const err = new AppError('message');
    expect(err.statusCode).toBe(500);
    expect(err.errorCode).toBe('INTERNAL_ERROR');
    expect(err.details).toBeNull();
  });
});

describe('NotFoundError', () => {
  it('has 404 status', () => {
    const err = new NotFoundError();
    expect(err.statusCode).toBe(404);
    expect(err.errorCode).toBe('NOT_FOUND');
    expect(err.message).toBe('Resource not found');
    expect(err.isOperational).toBe(true);
  });

  it('accepts custom message and details', () => {
    const err = new NotFoundError('Movie missing', { id: 1 });
    expect(err.message).toBe('Movie missing');
    expect(err.details).toEqual({ id: 1 });
  });
});

describe('UnauthorizedError', () => {
  it('has 401 status', () => {
    const err = new UnauthorizedError();
    expect(err.statusCode).toBe(401);
    expect(err.errorCode).toBe('UNAUTHORIZED');
    expect(err.message).toBe('Unauthorized access');
  });
});

describe('ForbiddenError', () => {
  it('has 403 status', () => {
    const err = new ForbiddenError();
    expect(err.statusCode).toBe(403);
    expect(err.errorCode).toBe('FORBIDDEN');
    expect(err.message).toBe('Forbidden');
  });
});

describe('ValidationError', () => {
  it('has 422 status with details', () => {
    const details = [{ field: 'email', message: 'Invalid email' }];
    const err = new ValidationError('Validation failed', details);
    expect(err.statusCode).toBe(422);
    expect(err.errorCode).toBe('VALIDATION_ERROR');
    expect(err.details).toEqual(details);
  });
});

describe('ConflictError', () => {
  it('has 409 status', () => {
    const err = new ConflictError();
    expect(err.statusCode).toBe(409);
    expect(err.errorCode).toBe('CONFLICT');
    expect(err.message).toBe('Resource already exists');
  });
});

describe('TooManyRequestsError', () => {
  it('has 429 status', () => {
    const err = new TooManyRequestsError();
    expect(err.statusCode).toBe(429);
    expect(err.errorCode).toBe('TOO_MANY_REQUESTS');
  });
});

describe('PaymentError', () => {
  it('has 402 status by default', () => {
    const err = new PaymentError();
    expect(err.statusCode).toBe(402);
    expect(err.errorCode).toBe('PAYMENT_ERROR');
  });

  it('accepts custom statusCode and errorCode', () => {
    const err = new PaymentError('Custom', 400, 'CUSTOM_ERROR');
    expect(err.statusCode).toBe(400);
    expect(err.errorCode).toBe('CUSTOM_ERROR');
    expect(err.message).toBe('Custom');
  });
});

describe('RateLimitError', () => {
  it('has 429 status with RATE_LIMITED code', () => {
    const err = new RateLimitError();
    expect(err.statusCode).toBe(429);
    expect(err.errorCode).toBe('RATE_LIMITED');
    expect(err.message).toBe('Rate limit exceeded');
  });
});
