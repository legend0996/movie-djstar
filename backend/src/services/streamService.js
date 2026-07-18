const movieRepository = require('../repositories/movieRepository');
const libraryRepository = require('../repositories/libraryRepository');
const r2Service = require('./r2Service');
const { NotFoundError, ForbiddenError } = require('../utils/errors');
const logger = require('../utils/logger');

const streamService = {
  async resolveMovie(movieIdOrSlug) {
    const isNumeric = /^\d+$/.test(String(movieIdOrSlug));
    return isNumeric
      ? movieRepository.findById(parseInt(movieIdOrSlug, 10))
      : movieRepository.findBySlug(movieIdOrSlug);
  },

  async streamMovie(userId, movieId, range, ip, userAgent) {
    const movie = await this.resolveMovie(movieId);
    if (!movie) {throw new NotFoundError('Movie not found');}

    const owned = await libraryRepository.isOwned(userId, movie.id);
    if (!owned) {throw new ForbiddenError('You do not own this movie');}
    if (!movie.movie_url) {throw new NotFoundError('Movie file not available');}

    const fileMetadata = await r2Service.getFileMetadata(movie.movie_url);
    if (!fileMetadata) {throw new NotFoundError('Movie file not found in storage');}

    const fileSize = fileMetadata.contentLength;
    const contentType = fileMetadata.contentType || 'video/mp4';

    let streamData;
    let statusCode;
    let headers;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = (end - start) + 1;

      streamData = await r2Service.getFileStream(movie.movie_url, `bytes=${start}-${end}`);

      statusCode = 206;
      headers = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=3600',
      };
    } else {
      streamData = await r2Service.getFileStream(movie.movie_url);

      statusCode = 200;
      headers = {
        'Content-Length': fileSize,
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'private, max-age=3600',
      };
    }

    await libraryRepository.logStream(userId, movie.id, ip, userAgent);
    await movieRepository.incrementStreams(movie.id);

    return { streamData, statusCode, headers, movie };
  },

  async streamTrailer(movieId, range) {
    const movie = await this.resolveMovie(movieId);
    if (!movie) {throw new NotFoundError('Movie not found');}
    if (!movie.trailer_url) {throw new NotFoundError('Trailer not available');}

    const fileMetadata = await r2Service.getFileMetadata(movie.trailer_url);
    if (!fileMetadata) {throw new NotFoundError('Trailer file not found');}

    const fileSize = fileMetadata.contentLength;
    const contentType = fileMetadata.contentType || 'video/mp4';

    let streamData;
    let statusCode;
    let headers;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = (end - start) + 1;

      streamData = await r2Service.getFileStream(movie.trailer_url, `bytes=${start}-${end}`);

      statusCode = 206;
      headers = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': contentType,
      };
    } else {
      streamData = await r2Service.getFileStream(movie.trailer_url);

      statusCode = 200;
      headers = {
        'Content-Length': fileSize,
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes',
      };
    }

    return { streamData, statusCode, headers };
  },

  async downloadMovie(userId, movieId, ip, userAgent) {
    const movie = await this.resolveMovie(movieId);
    if (!movie) {throw new NotFoundError('Movie not found');}

    const owned = await libraryRepository.isOwned(userId, movie.id);
    if (!owned) {throw new ForbiddenError('You do not own this movie');}
    if (!movie.movie_url) {throw new NotFoundError('Movie file not available');}

    const fileMetadata = await r2Service.getFileMetadata(movie.movie_url);
    if (!fileMetadata) {throw new NotFoundError('Movie file not found in storage');}

    const filename = `${movie.slug}.${movie.movie_format || 'mp4'}`;
    const streamData = await r2Service.getFileStream(movie.movie_url);

    await libraryRepository.logDownload(userId, movie.id, ip, userAgent);
    await movieRepository.incrementDownloads(movie.id);

    return {
      streamData,
      headers: {
        'Content-Type': fileMetadata.contentType || 'video/mp4',
        'Content-Length': fileMetadata.contentLength,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, max-age=3600',
      },
    };
  },

  async getSignedDownloadUrl(userId, movieId) {
    const movie = await this.resolveMovie(movieId);
    if (!movie) {throw new NotFoundError('Movie not found');}

    const owned = await libraryRepository.isOwned(userId, movie.id);
    if (!owned) {throw new ForbiddenError('You do not own this movie');}
    if (!movie.movie_url) {throw new NotFoundError('Movie file not available');}

    const signedUrl = await r2Service.getSignedDownloadUrl(movie.movie_url, 3600);

    await libraryRepository.logDownload(userId, movie.id, null, null);
    await movieRepository.incrementDownloads(movie.id);

    return { url: signedUrl };
  },
};

module.exports = streamService;
