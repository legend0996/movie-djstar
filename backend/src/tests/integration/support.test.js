const request = require('supertest');
const app = require('../../app');
const userRepository = require('../../repositories/userRepository');
const { createMockUser, createMockToken } = require('../helpers/testFactory');

jest.mock('../../services/emailService');

describe('Support Integration', () => {
  const user = createMockUser();
  const token = createMockToken(user);
  const db = require('../../config/database');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/support', () => {
    it('returns 201 creates ticket', async () => {
      userRepository.findById.mockResolvedValue(user);
      db.execute
        .mockResolvedValueOnce([{ insertId: 1 }])
        .mockResolvedValueOnce([[]]);

      const res = await request(app)
        .post('/api/support')
        .set('Authorization', `Bearer ${token}`)
        .send({ subject: 'Help needed with movie', message: 'I cannot stream the movie I purchased' })
        .expect(201);

      expect(res.body.data.id).toBeDefined();
    });
  });

  describe('GET /api/support', () => {
    it('returns 200 with users tickets', async () => {
      db.execute
        .mockResolvedValueOnce([[{ id: 1, subject: 'Test', status: 'open' }]])
        .mockResolvedValueOnce([[{ total: 1 }]]);

      const res = await request(app)
        .get('/api/support')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.pagination).toBeDefined();
    });
  });

  describe('GET /api/support/:id', () => {
    it('returns 200 with ticket + replies', async () => {
      db.execute
        .mockResolvedValueOnce([[{
          id: 1, subject: 'Test', message: 'Body', status: 'open',
          username: 'testuser', email: 'test@example.com',
        }]])
        .mockResolvedValueOnce([[{ id: 1, message: 'Reply', username: 'admin' }]]);

      const res = await request(app)
        .get('/api/support/1')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data.replies).toBeInstanceOf(Array);
    });
  });

  describe('POST /api/support/:id/reply', () => {
    it('returns 200', async () => {
      db.execute
        .mockResolvedValueOnce([[{ id: 1, subject: 'Test', status: 'open' }]])
        .mockResolvedValueOnce([{ insertId: 5 }])
        .mockResolvedValueOnce([[]]);

      const res = await request(app)
        .post('/api/support/1/reply')
        .set('Authorization', `Bearer ${token}`)
        .send({ message: 'Thanks for the help' })
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });
});
