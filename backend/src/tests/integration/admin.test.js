const request = require('supertest');
const app = require('../../app');
const adminService = require('../../services/adminService');
const userRepository = require('../../repositories/userRepository');
const { createMockUser, createMockToken } = require('../helpers/testFactory');

jest.mock('../../services/adminService');

describe('Admin Integration', () => {
  const movieOwner = createMockUser({ id: 2, role_slug: 'movie_owner', role_id: 2, username: 'movieowner' });
  const developer = createMockUser({ id: 3, role_slug: 'developer', role_id: 1, username: 'developer' });
  const regularUser = createMockUser({ id: 1, role_slug: 'user', role_id: 3, username: 'user' });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/admin/movie-owner/dashboard', () => {
    it('returns 200 for movie_owner', async () => {
      const token = createMockToken(movieOwner);
      userRepository.findById.mockResolvedValue(movieOwner);
      adminService.getMovieOwnerDashboard.mockResolvedValue({
        movies: { total: 10, published: 5 },
      });

      const res = await request(app)
        .get('/api/admin/movie-owner/dashboard')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data.movies).toBeDefined();
    });
  });

  describe('GET /api/admin/developer/dashboard', () => {
    it('returns 200 for developer', async () => {
      const token = createMockToken(developer);
      userRepository.findById.mockResolvedValue(developer);
      adminService.getDeveloperDashboard.mockResolvedValue({
        users: { total: 100, active: 80 },
      });

      const res = await request(app)
        .get('/api/admin/developer/dashboard')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data.users).toBeDefined();
    });

    it('returns 403 for movie_owner', async () => {
      const token = createMockToken(movieOwner);
      userRepository.findById.mockResolvedValue(movieOwner);

      const res = await request(app)
        .get('/api/admin/developer/dashboard')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });
  });

  describe('GET /api/admin/users', () => {
    it('returns 200 for developer', async () => {
      const token = createMockToken(developer);
      userRepository.findById.mockResolvedValue(developer);
      userRepository.findAll.mockResolvedValue({
        rows: [createMockUser()],
        total: 1,
      });

      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  describe('PUT /api/admin/users/:id/status', () => {
    it('returns 200 for developer', async () => {
      const token = createMockToken(developer);
      userRepository.findById.mockResolvedValue(developer);
      adminService.updateUserStatus.mockResolvedValue({
        message: 'User status updated to active',
      });

      const res = await request(app)
        .put('/api/admin/users/1/status')
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'active' })
        .expect(200);

      expect(res.body.data.message).toContain('active');
    });
  });
});
