jest.mock('../../services/emailService');

const request = require('supertest');
const app = require('../../app');
const userRepository = require('../../repositories/userRepository');
const supportRepository = require('../../repositories/supportRepository');
const { createMockUser, createMockToken } = require('../helpers/testFactory');

describe('Support Integration', () => {
  const user = createMockUser();
  const token = createMockToken(user);

  beforeEach(() => {
    jest.clearAllMocks();
    userRepository.findById.mockResolvedValue(user);
  });

  describe('POST /api/support', () => {
    it('returns 201 creates ticket', async () => {
      supportRepository.createTicket.mockResolvedValue(1);

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
      supportRepository.getUserTickets.mockResolvedValue({
        rows: [{ id: 1, subject: 'Test', status: 'open' }],
        total: 1,
      });

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
      supportRepository.getTicketWithReplies.mockResolvedValue({
        id: 1, subject: 'Test', message: 'Body', status: 'open',
        user: { username: 'testuser', email: 'test@example.com' },
        replies: [{ id: 1, message: 'Reply', user: { username: 'admin' } }],
      });

      const res = await request(app)
        .get('/api/support/1')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data.replies).toBeInstanceOf(Array);
    });
  });

  describe('POST /api/support/:id/reply', () => {
    it('returns 200', async () => {
      supportRepository.findTicketById.mockResolvedValue({ id: 1, subject: 'Test', status: 'open' });
      supportRepository.addReply.mockResolvedValue(5);

      const res = await request(app)
        .post('/api/support/1/reply')
        .set('Authorization', `Bearer ${token}`)
        .send({ message: 'Thanks for the help' })
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });
});
