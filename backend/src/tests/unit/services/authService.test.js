jest.mock('../../../services/emailService');
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn(),
}));
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock-token'),
  verify: jest.fn(),
}));
jest.mock('crypto', () => ({
  randomUUID: jest.fn().mockReturnValue('uuid'),
  randomInt: jest.fn().mockReturnValue(1),
  randomBytes: jest.fn().mockReturnValue({ toString: () => 'abcdef' }),
}));

const authService = require('../../../services/authService');
const userRepository = require('../../../repositories/userRepository');
const emailService = require('../../../services/emailService');
const { createMockUser } = require('../../helpers/testFactory');

describe('authService.register', () => {
  const registerData = {
    username: 'newuser',
    email: 'new@example.com',
    password: 'Str0ng!Pass',
    firstName: 'New',
    lastName: 'User',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

    it('creates user and returns userId', async () => {
      userRepository.findByUsername.mockResolvedValue(null);
      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.create.mockResolvedValue(42);
      const roleRepository = require('../../../repositories/roleRepository');
      roleRepository.findBySlug.mockResolvedValue({ id: 1, slug: 'user', name: 'User' });

    const result = await authService.register(registerData);

    expect(userRepository.findByUsername).toHaveBeenCalledWith('newuser');
    expect(userRepository.findByEmail).toHaveBeenCalledWith('new@example.com');
    expect(userRepository.create).toHaveBeenCalled();
    expect(result).toEqual({ userId: 42 });
  });

  it('throws ConflictError on duplicate username', async () => {
    userRepository.findByUsername.mockResolvedValue(createMockUser());

    await expect(authService.register(registerData)).rejects.toMatchObject({
      statusCode: 409,
      errorCode: 'CONFLICT',
    });
  });
});

describe('authService.loginStep2', () => {
  const user = createMockUser();
  const bcrypt = require('bcryptjs');

  beforeEach(() => {
    jest.clearAllMocks();
    userRepository.findByUsername.mockResolvedValue(user);
  });

  it('returns tokens on valid credentials', async () => {
    bcrypt.compare.mockResolvedValue(true);
    userRepository.incrementLoginAttempts.mockResolvedValue(undefined);
    userRepository.resetLoginAttempts.mockResolvedValue(undefined);
    userRepository.update.mockResolvedValue(true);

    const result = await authService.loginStep2('testuser', 'correct-password');

    expect(result.user).toBeDefined();
    expect(result.tokens).toBeDefined();
    expect(result.tokens.accessToken).toBe('mock-token');
  });

  it('throws UnauthorizedError on wrong password', async () => {
    bcrypt.compare.mockResolvedValue(false);
    userRepository.incrementLoginAttempts.mockResolvedValue(undefined);

    await expect(authService.loginStep2('testuser', 'wrong-password')).rejects.toMatchObject({
      statusCode: 401,
      errorCode: 'UNAUTHORIZED',
    });
  });

  it('locks account after max attempts', async () => {
    bcrypt.compare.mockResolvedValue(false);
    userRepository.incrementLoginAttempts.mockResolvedValue(undefined);
    const lockedUser = { ...user, loginAttempts: 4, login_attempts: 4 };
    userRepository.findByUsername.mockResolvedValue(lockedUser);

    await expect(authService.loginStep2('testuser', 'wrong')).rejects.toMatchObject({
      statusCode: 429,
    });

    expect(userRepository.lockAccount).toHaveBeenCalled();
  });
});

describe('authService.verifyEmail', () => {
  const user = createMockUser({ email_verified_at: null });
  const db = require('../../../config/database');

  beforeEach(() => {
    jest.clearAllMocks();
    userRepository.findByEmail.mockResolvedValue(user);
    db.query.mockResolvedValue([[{ id: 1, attempts: 0, max_attempts: 5 }]]);
  });

  it('activates user and returns tokens', async () => {
    const result = await authService.verifyEmail('test@example.com', '123456');

    expect(userRepository.update).toHaveBeenCalledWith(user.id, expect.objectContaining({
      status: 'active',
    }));
    expect(result.tokens).toBeDefined();
  });
});

describe('authService.refreshAccessToken', () => {
  const jwt = require('jsonwebtoken');
  const db = require('../../../config/database');

  beforeEach(() => {
    jest.clearAllMocks();
    jwt.verify.mockReturnValue({ sub: 1, type: 'refresh' });
    db.query
      .mockResolvedValue([[{ id: 1, refresh_token: 'old-refresh' }]]);
    db.execute.mockResolvedValue([[]]);
    userRepository.findById.mockResolvedValue(createMockUser());
  });

  it('returns new token pair', async () => {
    const result = await authService.refreshAccessToken('valid-refresh-token');
    expect(result.accessToken).toBe('mock-token');
    expect(result.refreshToken).toBe('mock-token');
  });

  it('throws UnauthorizedError when session is revoked', async () => {
    jwt.verify.mockReturnValue({ sub: 1, type: 'refresh' });
    db.query.mockResolvedValueOnce([[]]);

    await expect(authService.refreshAccessToken('revoked-token')).rejects.toMatchObject({
      statusCode: 401,
    });
  });
});

describe('authService.logout', () => {
  it('revokes session and returns success message', async () => {
    const db = require('../../../config/database');
    db.execute.mockResolvedValue([[]]);

    const result = await authService.logout(1, 'some-token');
    expect(result).toEqual({ message: 'Logged out successfully.' });
  });
});
