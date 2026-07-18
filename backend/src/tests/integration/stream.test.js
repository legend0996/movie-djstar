const request = require('supertest');
const app = require('../../app');
const movieRepository = require('../../repositories/movieRepository');
const libraryRepository = require('../../repositories/libraryRepository');
const r2Service = require('../../services/r2Service');
const { createMockUser, createMockMovie, createMockToken } = require('../helpers/testFactory');

jest.mock('../../repositories/movieRepository');
jest.mock('../../repositories/libraryRepository');
jest.mock('../../services/r2Service');

class MockReadable {
  constructor() {
    this.Body = this;
    this.readable = true;
  }
  pipe() {
    return this;
  }
  on(event, cb) {
    if (event === 'end') process.nextTick(cb);
    return this;
  }
}

describe('Stream Integration', () => {
  const user = createMockUser();
  const token = createMockToken(user);
  const movie = createMockMovie();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/stream/trailer/:id', () => {
    it('returns 200 (public)', async () => {
      movieRepository.findById.mockResolvedValue(movie);
      movieRepository.findBySlug.mockResolvedValue(null);
      r2Service.getFileMetadata.mockResolvedValue({
        contentLength: 1000000,
        contentType: 'video/mp4',
      });
      r2Service.getFileStream.mockResolvedValue(new MockReadable());

      const res = await request(app)
        .get('/api/stream/trailer/1')
        .expect(200);

      expect(res.headers['content-type']).toBe('video/mp4');
    });
  });

  describe('GET /api/stream/movie/:id', () => {
    it('returns 401 without auth', async () => {
      const res = await request(app)
        .get('/api/stream/movie/1')
        .expect(401);
    });

    it('returns 403 if not owned', async () => {
      movieRepository.findById.mockResolvedValue(movie);
      movieRepository.findBySlug.mockResolvedValue(null);
      libraryRepository.isOwned.mockResolvedValue(false);

      const res = await request(app)
        .get('/api/stream/movie/1')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('returns 200 if owned', async () => {
      movieRepository.findById.mockResolvedValue(movie);
      movieRepository.findBySlug.mockResolvedValue(null);
      libraryRepository.isOwned.mockResolvedValue(true);
      r2Service.getFileMetadata.mockResolvedValue({
        contentLength: 1000000,
        contentType: 'video/mp4',
      });
      r2Service.getFileStream.mockResolvedValue(new MockReadable());

      const res = await request(app)
        .get('/api/stream/movie/1')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.headers['content-type']).toBe('video/mp4');
    });
  });

  describe('GET /api/stream/download/:id', () => {
    it('returns 200 with content-disposition', async () => {
      movieRepository.findById.mockResolvedValue(movie);
      movieRepository.findBySlug.mockResolvedValue(null);
      libraryRepository.isOwned.mockResolvedValue(true);
      r2Service.getFileMetadata.mockResolvedValue({
        contentLength: 1000000,
        contentType: 'video/mp4',
      });
      r2Service.getFileStream.mockResolvedValue(new MockReadable());

      const res = await request(app)
        .get('/api/stream/download/1')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.headers['content-disposition']).toMatch(/^attachment/);
    });
  });
});
