const db = require('../config/database');
const movieRepository = require('../repositories/movieRepository');
const categoryRepository = require('../repositories/categoryRepository');
const libraryRepository = require('../repositories/libraryRepository');
const userRepository = require('../repositories/userRepository');
const reviewService = require('./reviewService');
const r2Service = require('./r2Service');
const { logActivity } = require('../middleware/activityLogger');
const { slugify, paginate, generateUniqueSlug } = require('../utils/helpers');
const { NotFoundError, ValidationError, ForbiddenError } = require('../utils/errors');
const { MOVIE_STATUS, ROLES } = require('../constants');
const logger = require('../utils/logger');

const movieService = {
  async create(data, userId) {
    const slug = slugify(data.title);
    const finalSlug = await generateUniqueSlug(slug, (s) => movieRepository.findBySlug(s));

    const movieId = await movieRepository.create({
      ...data,
      slug: finalSlug,
      createdBy: userId,
    });

    const movie = await movieRepository.findById(movieId);
    await logActivity(userId, 'movie_created', 'movie', movieId, { title: data.title });

    return movie;
  },

  async update(movieId, data, userId) {
    const movie = await movieRepository.findById(movieId);
    if (!movie) {throw new NotFoundError('Movie not found');}

    if (movie.createdBy && movie.createdBy !== userId) {
      const user = await userRepository.findById(userId);
      if (!user || (user.role?.slug !== ROLES.DEVELOPER && user.role?.slug !== ROLES.MOVIE_OWNER)) {
        throw new ForbiddenError('You do not have permission to update this movie');
      }
    }

    const updates = { ...data };
    if (data.title && data.title !== movie.title) {
      const newSlug = slugify(data.title);
      updates.slug = await generateUniqueSlug(newSlug, (s) => movieRepository.findBySlug(s));
    }

    await movieRepository.update(movieId, updates);
    const updated = await movieRepository.findById(movieId);
    await logActivity(userId, 'movie_updated', 'movie', movieId, { changes: Object.keys(updates) });

    return updated;
  },

  async delete(movieId, userId) {
    const movie = await movieRepository.findById(movieId);
    if (!movie) {throw new NotFoundError('Movie not found');}

    await movieRepository.delete(movieId);
    await logActivity(userId, 'movie_deleted', 'movie', movieId, { title: movie.title });
  },

  async getMovie(movieId, userId, userRole) {
    const movie = await movieRepository.findById(movieId);
    if (!movie) {throw new NotFoundError('Movie not found');}

    const isOwnerOrDev = userRole === ROLES.DEVELOPER || userRole === ROLES.MOVIE_OWNER;
    if (movie.status !== MOVIE_STATUS.PUBLISHED && !isOwnerOrDev) {
      throw new NotFoundError('Movie not found');
    }

    const enriched = await reviewService.attachSingleMovieStats(movie);
    return enrichWithLibraryStatus(enriched, userId);
  },

  async getMovieBySlug(slug, userId, userRole) {
    const movie = await movieRepository.findBySlug(slug);
    if (!movie) {throw new NotFoundError('Movie not found');}

    const isOwnerOrDev = userRole === ROLES.DEVELOPER || userRole === ROLES.MOVIE_OWNER;
    if (movie.status !== MOVIE_STATUS.PUBLISHED && !isOwnerOrDev) {
      throw new NotFoundError('Movie not found');
    }

    const enriched = await reviewService.attachSingleMovieStats(movie);
    return enrichWithLibraryStatus(enriched, userId);
  },

  async list({ page, limit, category, status, search, sort, featured, userRole } = {}) {
    const { page: p, limit: l, offset } = paginate(page, limit);

    const options = { page: p, limit: l, search, sort: sort || 'newest' };
    if (category) {options.categoryId = parseInt(category);}
    if (featured) {options.featured = true;}

    const isPrivileged = userRole === ROLES.DEVELOPER || userRole === ROLES.MOVIE_OWNER;
    if (!isPrivileged) {
      options.status = MOVIE_STATUS.PUBLISHED;
    } else if (status) {
      options.status = status;
    }

    const result = await movieRepository.findAll(options);
    result.rows = await reviewService.attachReviewStats(result.rows);
    return result;
  },

  async getPopular(limit = 10) {
    const movies = await movieRepository.getPopular(limit);
    return reviewService.attachReviewStats(movies);
  },

  async getRecent(limit = 10) {
    const movies = await movieRepository.getRecent(limit);
    return reviewService.attachReviewStats(movies);
  },

  async getFeatured(limit = 10) {
    const movies = await movieRepository.getFeatured(limit);
    return reviewService.attachReviewStats(movies);
  },

  async searchMovies(query, { page, limit, category } = {}) {
    if (!query || query.trim().length < 1) {
      throw new ValidationError('Search query is required');
    }
    const { page: p, limit: l } = paginate(page, limit);
    const result = await movieRepository.search(query.trim(), { page: p, limit: l, category });
    result.rows = await reviewService.attachReviewStats(result.rows);
    return result;
  },

  async getCategories(visibleOnly = true) {
    return categoryRepository.findAll(visibleOnly);
  },

  async createCategory(data) {
    const existing = await categoryRepository.findBySlug(slugify(data.name));
    if (existing) {throw new ValidationError('Category already exists');}

    const id = await categoryRepository.create(data);
    return categoryRepository.findById(id);
  },

  async updateCategory(categoryId, data) {
    const category = await categoryRepository.findById(categoryId);
    if (!category) {throw new NotFoundError('Category not found');}

    await categoryRepository.update(categoryId, data);
    return categoryRepository.findById(categoryId);
  },

  async deleteCategory(categoryId) {
    const category = await categoryRepository.findById(categoryId);
    if (!category) {throw new NotFoundError('Category not found');}

    await categoryRepository.delete(categoryId);
  },

  async reorderCategories(orders) {
    if (!Array.isArray(orders)) {throw new ValidationError('Orders must be an array');}
    for (const { id, order } of orders) {
      await categoryRepository.reorder(id, order);
    }
  },

  async getLibrary(userId, { page, limit } = {}) {
    const { page: p, limit: l } = paginate(page, limit);
    return libraryRepository.getUserLibrary(userId, { page: p, limit: l });
  },

  async getContinueWatching(userId, limit = 10) {
    return libraryRepository.getContinueWatching(userId, limit);
  },

  async savePlaybackProgress(userId, movieId, positionSeconds, durationSeconds, completed) {
    const owned = await libraryRepository.isOwned(userId, movieId);
    if (!owned) {throw new NotFoundError('Movie not found in your library');}

    await libraryRepository.savePlaybackProgress(userId, movieId, positionSeconds, durationSeconds, completed);
  },

  async getDownloadHistory(userId, { page, limit } = {}) {
    const { page: p, limit: l } = paginate(page, limit);
    return libraryRepository.getDownloadHistory(userId, { page: p, limit: l });
  },

  async getStreamHistory(userId, { page, limit } = {}) {
    const { page: p, limit: l } = paginate(page, limit);
    return libraryRepository.getStreamHistory(userId, { page: p, limit: l });
  },

  async uploadPoster(file, movieId) {
    const movie = await movieRepository.findById(movieId);
    if (!movie) {throw new NotFoundError('Movie not found');}

    const result = await r2Service.uploadFile(
      file.buffer,
      `poster-${Date.now()}-${file.originalname}`,
      file.mimetype,
      'posters',
    );

    const publicUrl = await r2Service.getPublicUrl(result.key);
    const url = publicUrl || result.key;
    await movieRepository.update(movieId, { poster_url: url });

    return { url, key: result.key };
  },

  async uploadTrailer(file, movieId) {
    const movie = await movieRepository.findById(movieId);
    if (!movie) {throw new NotFoundError('Movie not found');}

    const result = await r2Service.uploadFile(
      file.buffer,
      `trailer-${Date.now()}-${file.originalname}`,
      file.mimetype,
      'trailers',
    );

    const publicUrl = await r2Service.getPublicUrl(result.key);
    const url = publicUrl || result.key;
    await movieRepository.update(movieId, { trailer_url: url });

    return { url, key: result.key };
  },

  async uploadMovieFile(file, movieId) {
    const movie = await movieRepository.findById(movieId);
    if (!movie) {throw new NotFoundError('Movie not found');}

    const result = await r2Service.uploadFile(
      file.buffer,
      `movie-${Date.now()}-${file.originalname}`,
      file.mimetype || 'video/mp4',
      'movies',
    );

    await movieRepository.update(movieId, {
      movie_url: result.key,
      movie_size: file.size,
      movie_format: file.originalname.split('.').pop(),
    });

    return { key: result.key };
  },
};

async function enrichWithLibraryStatus(movie, userId) {
  if (!userId) {return { ...movie, inLibrary: false, hasPurchased: false };}
  try {
    const owned = await libraryRepository.isOwned(userId, movie.id);
    return { ...movie, inLibrary: owned, hasPurchased: owned };
  } catch {
    return { ...movie, inLibrary: false, hasPurchased: false };
  }
}

module.exports = movieService;
