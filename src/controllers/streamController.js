const movieRepository = require('../repositories/movieRepository');
const libraryRepository = require('../repositories/libraryRepository');
const r2Service = require('../services/r2Service');
const response = require('../utils/response');
const { NotFoundError, ForbiddenError } = require('../utils/errors');
const logger = require('../utils/logger');

const streamController = {
  async streamMovie(req, res, next) {
    try {
      const { id } = req.params;
      let movie;

      if (isNaN(id)) {
        movie = await movieRepository.findBySlug(id);
      } else {
        movie = await movieRepository.findById(parseInt(id));
      }

      if (!movie) throw new NotFoundError('Movie not found');

      const owned = await libraryRepository.isOwned(req.user.id, movie.id);
      if (!owned) {
        throw new ForbiddenError('You do not own this movie');
      }

      if (!movie.movie_url) {
        throw new NotFoundError('Movie file not available');
      }

      const fileMetadata = await r2Service.getFileMetadata(movie.movie_url);
      if (!fileMetadata) {
        throw new NotFoundError('Movie file not found in storage');
      }

      const fileSize = fileMetadata.contentLength;
      const range = req.headers.range;

      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunkSize = (end - start) + 1;

        const streamData = await r2Service.getFileStream(movie.movie_url, `bytes=${start}-${end}`);

        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize,
          'Content-Type': fileMetadata.contentType || 'video/mp4',
          'Cache-Control': 'private, max-age=3600',
        });

        streamData.Body.pipe(res);

        await libraryRepository.logStream(req.user.id, movie.id, req.ip, req.headers['user-agent']);
        await movieRepository.incrementStreams(movie.id);
      } else {
        const streamData = await r2Service.getFileStream(movie.movie_url);

        res.writeHead(200, {
          'Content-Length': fileSize,
          'Content-Type': fileMetadata.contentType || 'video/mp4',
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'private, max-age=3600',
        });

        streamData.Body.pipe(res);

        await libraryRepository.logStream(req.user.id, movie.id, req.ip, req.headers['user-agent']);
        await movieRepository.incrementStreams(movie.id);
      }

      req.on('close', () => {
        logger.debug('Stream connection closed', { movieId: movie.id, userId: req.user.id });
      });
    } catch (err) {
      next(err);
    }
  },

  async streamTrailer(req, res, next) {
    try {
      const { id } = req.params;
      let movie;

      if (isNaN(id)) {
        movie = await movieRepository.findBySlug(id);
      } else {
        movie = await movieRepository.findById(parseInt(id));
      }

      if (!movie || movie.status !== 'published') throw new NotFoundError('Movie not found');
      if (!movie.trailer_url) throw new NotFoundError('Trailer not available');

      const trailerKey = movie.trailer_url;

      const fileMetadata = await r2Service.getFileMetadata(trailerKey);
      if (!fileMetadata) {
        throw new NotFoundError('Trailer file not found');
      }

      const fileSize = fileMetadata.contentLength;
      const range = req.headers.range;

      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunkSize = (end - start) + 1;

        const streamData = await r2Service.getFileStream(trailerKey, `bytes=${start}-${end}`);

        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize,
          'Content-Type': fileMetadata.contentType || 'video/mp4',
        });

        streamData.Body.pipe(res);
      } else {
        const streamData = await r2Service.getFileStream(trailerKey);

        res.writeHead(200, {
          'Content-Length': fileSize,
          'Content-Type': fileMetadata.contentType || 'video/mp4',
          'Accept-Ranges': 'bytes',
        });

        streamData.Body.pipe(res);
      }
    } catch (err) {
      next(err);
    }
  },

  async downloadMovie(req, res, next) {
    try {
      const { id } = req.params;
      let movie;

      if (isNaN(id)) {
        movie = await movieRepository.findBySlug(id);
      } else {
        movie = await movieRepository.findById(parseInt(id));
      }

      if (!movie) throw new NotFoundError('Movie not found');

      const owned = await libraryRepository.isOwned(req.user.id, movie.id);
      if (!owned) {
        throw new ForbiddenError('You do not own this movie');
      }

      if (!movie.movie_url) {
        throw new NotFoundError('Movie file not available');
      }

      const fileMetadata = await r2Service.getFileMetadata(movie.movie_url);
      if (!fileMetadata) {
        throw new NotFoundError('Movie file not found in storage');
      }

      const filename = `${movie.slug}.${movie.movie_format || 'mp4'}`;
      const streamData = await r2Service.getFileStream(movie.movie_url);

      res.writeHead(200, {
        'Content-Type': fileMetadata.contentType || 'video/mp4',
        'Content-Length': fileMetadata.contentLength,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, max-age=3600',
      });

      streamData.Body.pipe(res);

      await libraryRepository.logDownload(req.user.id, movie.id, req.ip, req.headers['user-agent']);
      await movieRepository.incrementDownloads(movie.id);

      req.on('close', () => {
        logger.debug('Download connection closed', { movieId: movie.id, userId: req.user.id });
      });
    } catch (err) {
      next(err);
    }
  },

  async getSignedDownloadUrl(req, res, next) {
    try {
      const { id } = req.params;
      let movie;

      if (isNaN(id)) {
        movie = await movieRepository.findBySlug(id);
      } else {
        movie = await movieRepository.findById(parseInt(id));
      }

      if (!movie) throw new NotFoundError('Movie not found');

      const owned = await libraryRepository.isOwned(req.user.id, movie.id);
      if (!owned) {
        throw new ForbiddenError('You do not own this movie');
      }

      if (!movie.movie_url) {
        throw new NotFoundError('Movie file not available');
      }

      const signedUrl = await r2Service.getSignedDownloadUrl(movie.movie_url, 3600);

      await libraryRepository.logDownload(req.user.id, movie.id, req.ip, req.headers['user-agent']);
      await movieRepository.incrementDownloads(movie.id);

      return response.success(res, { url: signedUrl });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = streamController;
