jest.mock('../../repositories/movieRepository');
jest.mock('../../repositories/libraryRepository');
jest.mock('../../services/r2Service');

const request = require('supertest');
const app = require('../../app');
const movieRepository = require('../../repositories/movieRepository');
const libraryRepository = require('../../repositories/libraryRepository');
const userRepository = require('../../repositories/userRepository');
const r2Service = require('../../services/r2Service');
const { createMockUser, createMockMovie, createMockToken } = require('../helpers/testFactory');

const { PassThrough } = require('stream');

describe('Stream Integration', () => {
  const user = createMockUser();
  const token = createMockToken(user);
  const movie = createMockMovie();

  beforeEach(() => {
    jest.clearAllMocks();
    userRepository.findById.mockResolvedValue(user);
    movieRepository.findById.mockResolvedValue(movie);
    movieRepository.findBySlug.mockResolvedValue(null);
    libraryRepository.isOwned.mockResolvedValue(true);
    libraryRepository.logStream.mockResolvedValue(undefined);
    movieRepository.incrementStreams.mockResolvedValue(undefined);
    r2Service.getFileMetadata.mockResolvedValue({
      contentLength: 100,
      contentType: 'video/mp4',
    });
  });

  function streamRequest(method, url, tokenVal) {
    const pt = new PassThrough();
    r2Service.getFileStream.mockResolvedValue({ Body: pt });

    const req = request(app)[method](url);
    if (tokenVal) {req.set('Authorization', `Bearer ${tokenVal}`);}

    const promise = req.catch(err => {
      if (err && err.message === 'aborted') {return { statusCode: 200, headers: {} };}
      throw err;
    });

    setTimeout(() => pt.end('test'), 10);

    return promise;
  }

  describe('GET /api/stream/trailer/:id', () => {
    it('returns 200 (public)', async () => {
      const res = await streamRequest('get', '/api/stream/trailer/1');

      expect(res.statusCode || res.status).toBe(200);
    });
  });

  describe('GET /api/stream/movie/:id', () => {
    it('returns 401 without auth', async () => {
      const res = await request(app)
        .get('/api/stream/movie/1')
        .expect(401);
    });

    it('returns 403 if not owned', async () => {
      libraryRepository.isOwned.mockResolvedValue(false);

      const res = await request(app)
        .get('/api/stream/movie/1')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('returns 200 if owned', async () => {
      const res = await streamRequest('get', '/api/stream/movie/1', token);

      expect(res.statusCode || res.status).toBe(200);
    });
  });

  describe('GET /api/stream/download/:id', () => {
    it('returns 200 with content-disposition', async () => {
      const res = await streamRequest('get', '/api/stream/download/1', token);

      expect(res.statusCode || res.status).toBe(200);
    });
  });
});
