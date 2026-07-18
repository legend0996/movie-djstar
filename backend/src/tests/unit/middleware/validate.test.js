const Joi = require('joi');
const { validate } = require('../../../middleware/validate');

describe('validate middleware', () => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(3).required(),
  });

  const next = jest.fn();

  beforeEach(() => {
    next.mockClear();
  });

  it('valid body passes through', () => {
    const req = { body: { email: 'test@example.com', password: '123' } };
    validate(schema)(req, {}, next);

    expect(next).toHaveBeenCalled();
    expect(req.body.email).toBe('test@example.com');
  });

  it('invalid body throws ValidationError with details array', () => {
    const req = { body: { email: 'bad', password: '' } };

    expect(() => validate(schema)(req, {}, next)).toThrow();

    try {
      validate(schema)(req, {}, next);
    } catch (err) {
      expect(err.statusCode).toBe(422);
      expect(err.errorCode).toBe('VALIDATION_ERROR');
      expect(Array.isArray(err.details)).toBe(true);
      expect(err.details.length).toBeGreaterThan(0);
      expect(err.details[0]).toHaveProperty('field');
      expect(err.details[0]).toHaveProperty('message');
    }
  });

  it('strips unknown fields', () => {
    const req = { body: { email: 'test@example.com', password: '123', unknownField: 'should be stripped' } };
    validate(schema)(req, {}, next);

    expect(req.body.unknownField).toBeUndefined();
    expect(req.body.email).toBe('test@example.com');
  });

  it('source=query validates query params', () => {
    const querySchema = Joi.object({
      q: Joi.string().required(),
    });

    const req = { query: { q: 'search' } };
    validate(querySchema, 'query')(req, {}, next);

    expect(next).toHaveBeenCalled();
  });

  it('source=query throws on invalid query params', () => {
    const querySchema = Joi.object({
      q: Joi.string().required(),
    });

    const req = { query: {} };
    expect(() => validate(querySchema, 'query')(req, {}, next)).toThrow();
  });
});
