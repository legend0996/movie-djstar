const jwt = require('jsonwebtoken');
const config = require('../../../config');
const { authenticate, authorize, optionalAuth, verifiedUser, activeUser } = require('../../../middleware/auth');
const userRepository = require('../../../repositories/userRepository');
const { createMockUser, createMockToken } = require('../../helpers/testFactory');

jest.mock('../../../repositories/userRepository');

function mockReq(headers = {}, user = null) {
  return { headers, user };
}

function mockRes() {
  return { status: jest.fn().mockReturnThis(), json: jest.fn() };
}

describe('authenticate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('extracts token and calls next() on valid token', async () => {
    const user = createMockUser();
    const token = createMockToken(user);
    userRepository.findById.mockResolvedValue(user);

    const req = mockReq({ authorization: `Bearer ${token}` });
    const next = jest.fn();

    await authenticate(req, mockRes(), next);

    expect(userRepository.findById).toHaveBeenCalledWith(user.id);
    expect(req.user).toBeDefined();
    expect(req.user.id).toBe(user.id);
    expect(req.user.role).toBe(user.role_slug);
    expect(next).toHaveBeenCalled();
  });

  it('throws UnauthorizedError on missing token', async () => {
    const req = mockReq({});
    const next = jest.fn();

    await authenticate(req, mockRes(), next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 401,
      errorCode: 'UNAUTHORIZED',
    }));
  });

  it('throws UnauthorizedError on invalid auth header', async () => {
    const req = mockReq({ authorization: 'Basic xyz' });
    const next = jest.fn();

    await authenticate(req, mockRes(), next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('throws on expired token', async () => {
    const expiredToken = jwt.sign(
      { sub: 1, username: 'testuser', role: 'user' },
      config.jwt.secret,
      { expiresIn: '0s', issuer: config.jwt.issuer }
    );

    const req = mockReq({ authorization: `Bearer ${expiredToken}` });
    const next = jest.fn();

    await authenticate(req, mockRes(), next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 401,
      message: 'Token has expired',
    }));
  });
});

describe('authorize', () => {
  it('passes for allowed role', () => {
    const req = { user: { role: 'movie_owner' } };
    const middleware = authorize('movie_owner', 'developer');
    const next = jest.fn();

    middleware(req, mockRes(), next);

    expect(next).toHaveBeenCalled();
  });

  it('throws Forbidden for disallowed role', () => {
    const req = { user: { role: 'user' } };
    const middleware = authorize('developer');
    const next = jest.fn();

    middleware(req, mockRes(), next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 403,
      errorCode: 'FORBIDDEN',
    }));
  });

  it('throws Unauthorized when req.user is missing', () => {
    const req = {};
    const middleware = authorize('developer');
    const next = jest.fn();

    middleware(req, mockRes(), next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 401,
      errorCode: 'UNAUTHORIZED',
    }));
  });
});

describe('optionalAuth', () => {
  it('sets req.user to null when no token', async () => {
    const req = mockReq({});
    const next = jest.fn();

    await optionalAuth(req, mockRes(), next);

    expect(req.user).toBeNull();
    expect(next).toHaveBeenCalled();
  });

  it('calls authenticate when token is present', async () => {
    const user = createMockUser();
    const token = createMockToken(user);
    userRepository.findById.mockResolvedValue(user);

    const req = mockReq({ authorization: `Bearer ${token}` });
    const next = jest.fn();

    await optionalAuth(req, mockRes(), next);

    expect(req.user).toBeDefined();
    expect(next).toHaveBeenCalled();
  });
});

describe('verifiedUser', () => {
  it('passes for verified user', () => {
    const req = { user: { status: 'active' } };
    const next = jest.fn();
    verifiedUser(req, mockRes(), next);
    expect(next).toHaveBeenCalled();
  });

  it('throws for unverified user', () => {
    const req = { user: { status: 'unverified' } };
    const next = jest.fn();
    verifiedUser(req, mockRes(), next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 403,
      errorCode: 'FORBIDDEN',
    }));
  });

  it('throws if no user', () => {
    const req = {};
    const next = jest.fn();
    verifiedUser(req, mockRes(), next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });
});

describe('activeUser', () => {
  it('passes for active user', () => {
    const req = { user: { status: 'active' } };
    const next = jest.fn();
    activeUser(req, mockRes(), next);
    expect(next).toHaveBeenCalled();
  });

  it('throws for suspended user', () => {
    const req = { user: { status: 'suspended' } };
    const next = jest.fn();
    activeUser(req, mockRes(), next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 403,
      errorCode: 'FORBIDDEN',
    }));
  });
});
