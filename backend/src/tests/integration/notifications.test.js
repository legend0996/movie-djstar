const request = require('supertest');
const app = require('../../app');
const userRepository = require('../../repositories/userRepository');
const notificationRepository = require('../../repositories/notificationRepository');
const { createMockUser, createMockToken } = require('../helpers/testFactory');

describe('Notifications Integration', () => {
  const user = createMockUser();
  const token = createMockToken(user);

  beforeEach(() => {
    jest.clearAllMocks();
    userRepository.findById.mockResolvedValue(user);
  });

  describe('GET /api/notifications', () => {
    it('returns 200 with list', async () => {
      notificationRepository.getUserNotifications.mockResolvedValue({
        rows: [{ id: 1, title: 'Welcome', message: 'Hello!', is_read: false }],
        total: 1,
      });
      notificationRepository.getUnreadCount.mockResolvedValue(0);

      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.pagination).toBeDefined();
    });
  });

  describe('GET /api/notifications/unread-count', () => {
    it('returns 200 with count', async () => {
      notificationRepository.getUnreadCount.mockResolvedValue(3);

      const res = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data.unreadCount).toBe(3);
    });
  });

  describe('PUT /api/notifications/:id/read', () => {
    it('returns 200', async () => {
      notificationRepository.markAsRead.mockResolvedValue(true);

      const res = await request(app)
        .put('/api/notifications/1/read')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  describe('PUT /api/notifications/read-all', () => {
    it('returns 200', async () => {
      notificationRepository.markAllAsRead.mockResolvedValue(5);

      const res = await request(app)
        .put('/api/notifications/read-all')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data.markedRead).toBe(5);
    });
  });
});
