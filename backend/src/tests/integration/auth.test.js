jest.mock('../../services/emailService', () => ({
  sendVerificationCode: jest.fn().mockResolvedValue(),
  sendWelcomeEmail: jest.fn().mockResolvedValue(),
  sendPasswordResetCode: jest.fn().mockResolvedValue(),
  sendPasswordChangeConfirmation: jest.fn().mockResolvedValue(),
  sendPurchaseReceipt: jest.fn().mockResolvedValue(),
  sendTicketCreated: jest.fn().mockResolvedValue(),
}));
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn(),
}));
jest.mock('jsonwebtoken', () => {
  const actual = jest.requireActual('jsonwebtoken');
  return {
    ...actual,
    sign: jest.fn().mockReturnValue('mock-token'),
  };
});

const request = require('supertest');
const app = require('../../app');
const userRepository = require('../../repositories/userRepository');
const roleRepository = require('../../repositories/roleRepository');
const emailService = require('../../services/emailService');
const { createMockUser, createMockToken, createMockRefreshToken } = require('../helpers/testFactory');

describe('Auth Integration', () => {
  const db = require('../../config/database');

  beforeEach(() => {
    jest.clearAllMocks();
  });



  describe('POST /api/auth/register', () => {
    const validBody = {
      username: 'newuser',
      email: 'new@example.com',
      password: 'Str0ng!Pass',
      confirmPassword: 'Str0ng!Pass',
      firstName: 'New',
      lastName: 'User',
    };

    it('returns 201 with userId', async () => {
      userRepository.findByUsername.mockResolvedValue(null);
      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.create.mockResolvedValue(99);
      roleRepository.findBySlug.mockResolvedValue({ id: 1, slug: 'user', name: 'User' });

      const res = await request(app)
        .post('/api/auth/register')
        .send(validBody)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.userId).toBe(99);
    });

    it('returns 409 on duplicate username', async () => {
      userRepository.findByUsername.mockResolvedValue(createMockUser());
      roleRepository.findBySlug.mockResolvedValue({ id: 1, slug: 'user', name: 'User' });

      const res = await request(app)
        .post('/api/auth/register')
        .send(validBody)
        .expect(409);

      expect(res.body.errorCode).toBe('CONFLICT');
    });
  });

  describe('POST /api/auth/login/step1', () => {
    it('returns 200 with exists=true', async () => {
      userRepository.findByUsername.mockResolvedValue(createMockUser());

      const res = await request(app)
        .post('/api/auth/login/step1')
        .send({ username: 'testuser' })
        .expect(200);

      expect(res.body.data.exists).toBe(true);
    });
  });

  describe('POST /api/auth/login/step2', () => {
    const bcrypt = require('bcryptjs');

    it('returns 200 with tokens', async () => {
      const user = createMockUser();
      userRepository.findByUsername.mockResolvedValue(user);
      userRepository.resetLoginAttempts.mockResolvedValue(undefined);
      userRepository.update.mockResolvedValue(true);
      db.execute.mockResolvedValue([[]]);
      bcrypt.compare.mockResolvedValue(true);
      const res = await request(app)
        .post('/api/auth/login/step2')
        .send({ username: 'testuser', password: 'Str0ng!Pass' })
        .expect(200);

      expect(res.body.data.tokens).toBeDefined();
    });
  });

  describe('POST /api/auth/verify-email', () => {
    it('returns 200 on valid code', async () => {
      const user = createMockUser({ email_verified_at: null });
      userRepository.findByEmail.mockResolvedValue(user);
      userRepository.update.mockResolvedValue(true);
      db.query.mockResolvedValue([[{ id: 1, attempts: 0, max_attempts: 5 }]]);

      const res = await request(app)
        .post('/api/auth/verify-email')
        .send({ email: 'test@example.com', code: '123456' })
        .expect(200);

      expect(res.body.data.tokens).toBeDefined();
    });
  });

  describe('POST /api/auth/refresh-token', () => {
    const jwt = require('jsonwebtoken');

    it('returns 200 with new tokens', async () => {
      jwt.verify = jest.fn().mockReturnValue({ sub: 1, type: 'refresh' });
      userRepository.findById.mockResolvedValue(createMockUser());
      db.query.mockResolvedValueOnce([[{ id: 1, refresh_token: 'test' }]]);
      db.execute.mockResolvedValueOnce([[]]);

      const res = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken: 'eyJhbGciOiJIUzI1NiJ9.dGVzdA.test' })
        .expect(200);

      expect(res.body.data.accessToken).toBeDefined();
    });
  });

  describe('POST /api/auth/change-password', () => {
    const bcrypt = require('bcryptjs');

    it('returns 200 with success', async () => {
      const user = createMockUser();
      const token = createMockToken(user);
      userRepository.findById.mockResolvedValue(user);
      userRepository.update.mockResolvedValue(true);
      db.execute.mockResolvedValue([[]]);
      bcrypt.compare.mockResolvedValue(true);

      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({ currentPassword: 'oldPass1!', newPassword: 'NewStr0ng!Pass', confirmPassword: 'NewStr0ng!Pass' })
        .expect(200);

      expect(res.body.data).toBeDefined();
    });
  });

  describe('POST /api/auth/logout', () => {
    it('returns 200', async () => {
      const user = createMockUser();
      const token = createMockToken(user);
      userRepository.findById.mockResolvedValue(user);
      db.execute.mockResolvedValue([[]]);

      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/auth/profile', () => {
    it('returns 200 with user data', async () => {
      const user = createMockUser();
      const token = createMockToken(user);
      userRepository.findById.mockResolvedValue(user);
      db.execute.mockResolvedValue([[{ total_purchases: 5, total_spent: 29.95 }]]);

      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data.username).toBe('testuser');
      expect(res.body.data.email).toBe('test@example.com');
    });
  });

  describe('PUT /api/auth/profile', () => {
    it('returns 200 with updated data', async () => {
      const user = createMockUser();
      const token = createMockToken(user);
      userRepository.findById.mockResolvedValue(user);
      userRepository.update.mockResolvedValue(true);
      db.execute.mockResolvedValue([[{ total_purchases: 0, total_spent: 0 }]]);

      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ firstName: 'Updated' })
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  describe('Rate limiting on /api/auth/register', () => {
    it('returns 429 after too many requests', async () => {
      const validBody = {
        username: 'user',
        email: 'u@example.com',
        password: 'Str0ng!Pass',
        confirmPassword: 'Str0ng!Pass',
      };

      userRepository.findByUsername.mockResolvedValue(null);
      userRepository.findByEmail.mockResolvedValue(null);
      db.execute.mockResolvedValue([[{ id: 1, slug: 'user' }]]);
      userRepository.create.mockResolvedValue(1);

      for (let i = 0; i < 10; i++) {
        await request(app)
          .post('/api/auth/register')
          .send({ ...validBody, username: `user${i}`, email: `u${i}@example.com` });
      }

      const res = await request(app)
        .post('/api/auth/register')
        .send(validBody);

      expect(res.status).toBe(429);
    }, 30000);
  });
});
