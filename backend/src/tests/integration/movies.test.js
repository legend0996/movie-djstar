const request = require('supertest');
const app = require('../../app');
const movieRepository = require('../../repositories/movieRepository');
const categoryRepository = require('../../repositories/categoryRepository');
const userRepository = require('../../repositories/userRepository');
const { createMockUser, createMockMovie, createMockToken } = require('../helpers/testFactory');



describe('Movies Integration', () => {
  const user = createMockUser();
  const movieOwner = createMockUser({ id: 2, role_slug: 'movie_owner', role_id: 2, username: 'movieowner' });
  const dev = createMockUser({ id: 3, role_slug: 'developer', role_id: 1, username: 'developer' });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function setupAuth(mockUser) {
    userRepository.findById.mockResolvedValue(mockUser);
  }

  describe('GET /api/movies', () => {
    it('returns 200 with movie list', async () => {
      movieRepository.findAll.mockResolvedValue({ rows: [createMockMovie()], total: 1 });

      const res = await request(app)
        .get('/api/movies')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.pagination).toBeDefined();
    });
  });

  describe('GET /api/movies/popular', () => {
    it('returns 200', async () => {
      movieRepository.getPopular.mockResolvedValue([createMockMovie()]);

      const res = await request(app)
        .get('/api/movies/popular')
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/movies/featured', () => {
    it('returns 200 with featured only', async () => {
      const featured = createMockMovie({ is_featured: true });
      movieRepository.getFeatured.mockResolvedValue([featured]);

      const res = await request(app)
        .get('/api/movies/featured')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
    });
  });

  describe('GET /api/movies/:id', () => {
    it('returns 200 with movie data', async () => {
      const movie = createMockMovie();
      movieRepository.findById.mockResolvedValue(movie);

      const res = await request(app)
        .get('/api/movies/1')
        .expect(200);

      expect(res.body.data.title).toBe('Test Movie');
    });
  });

  describe('GET /api/movies/slug/:slug', () => {
    it('returns 200 with movie', async () => {
      const movie = createMockMovie();
      movieRepository.findBySlug.mockResolvedValue(movie);

      const res = await request(app)
        .get('/api/movies/slug/test-movie')
        .expect(200);

      expect(res.body.data.slug).toBe('test-movie');
    });
  });

  describe('GET /api/movies/search', () => {
    it('returns 200 with results', async () => {
      movieRepository.search.mockResolvedValue({ rows: [createMockMovie()], total: 1 });

      const res = await request(app)
        .get('/api/movies/search?q=test')
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/movies/categories', () => {
    it('returns 200', async () => {
      categoryRepository.findAll.mockResolvedValue([{ id: 1, name: 'Action', movie_count: 5 }]);

      const res = await request(app)
        .get('/api/movies/categories')
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  describe('POST /api/movies', () => {
    const movieData = { title: 'New Movie', description: 'Desc', price: 9.99 };

    it('returns 401 without auth', async () => {
      const res = await request(app)
        .post('/api/movies')
        .send(movieData)
        .expect(401);
    });

    it('returns 403 as user role', async () => {
      const token = createMockToken(user);
      setupAuth(user);

      const res = await request(app)
        .post('/api/movies')
        .set('Authorization', `Bearer ${token}`)
        .send(movieData)
        .expect(403);
    });

    it('returns 201 as movie_owner', async () => {
      const token = createMockToken(movieOwner);
      setupAuth(movieOwner);
      movieRepository.findBySlug.mockResolvedValue(null);
      movieRepository.create.mockResolvedValue(10);
      movieRepository.findById.mockResolvedValue(createMockMovie({ id: 10 }));

      const res = await request(app)
        .post('/api/movies')
        .set('Authorization', `Bearer ${token}`)
        .send(movieData)
        .expect(201);

      expect(res.body.data).toBeDefined();
    });
  });
});
