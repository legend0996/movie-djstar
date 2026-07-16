const movieRepository = require('../repositories/movieRepository');
const categoryRepository = require('../repositories/categoryRepository');
const libraryRepository = require('../repositories/libraryRepository');
const r2Service = require('../services/r2Service');
const response = require('../utils/response');
const { paginate, paginatedResponse } = require('../utils/helpers');
const { NotFoundError, ValidationError } = require('../utils/errors');
const { logActivity } = require('../middleware/activityLogger');
const { slugify } = require('../utils/helpers');

const movieController = {
  async list(req, res, next) {
    try {
      const { page: p, limit: l, category, status, search, sort, featured } = req.query;
      const { page, limit } = paginate(p, l);

      const options = { page, limit, search, sort: sort || 'newest' };
      if (category) options.categoryId = parseInt(category);
      if (featured === 'true') options.featured = true;

      if (!req.user || (req.user.role !== 'movie_owner' && req.user.role !== 'developer')) {
        options.status = 'published';
      } else if (status) {
        options.status = status;
      }

      const result = await movieRepository.findAll(options);
      return response.paginated(res, result.rows, { page, limit, total: result.total });
    } catch (err) {
      next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const movie = await movieRepository.findById(req.params.id);
      if (!movie) throw new NotFoundError('Movie not found');

      if (movie.status !== 'published' && (!req.user || (req.user.role !== 'movie_owner' && req.user.role !== 'developer'))) {
        throw new NotFoundError('Movie not found');
      }

      return response.success(res, movie);
    } catch (err) {
      next(err);
    }
  },

  async getBySlug(req, res, next) {
    try {
      const movie = await movieRepository.findBySlug(req.params.slug);
      if (!movie) throw new NotFoundError('Movie not found');

      if (movie.status !== 'published' && (!req.user || (req.user.role !== 'movie_owner' && req.user.role !== 'developer'))) {
        throw new NotFoundError('Movie not found');
      }

      return response.success(res, movie);
    } catch (err) {
      next(err);
    }
  },

  async create(req, res, next) {
    try {
      const slug = slugify(req.body.title);
      const existing = await movieRepository.findBySlug(slug);
      if (existing) {
        throw new ValidationError('A movie with this title already exists');
      }

      const movieId = await movieRepository.create({
        ...req.body,
        slug,
        createdBy: req.user.id,
      });

      const movie = await movieRepository.findById(movieId);
      await logActivity(req.user.id, 'movie_created', 'movie', movieId, { title: req.body.title });

      return response.created(res, movie, 'Movie created successfully');
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const movie = await movieRepository.findById(req.params.id);
      if (!movie) throw new NotFoundError('Movie not found');

      const updates = { ...req.body };
      if (req.body.title && req.body.title !== movie.title) {
        updates.slug = slugify(req.body.title);
      }

      await movieRepository.update(movie.id, updates);
      const updated = await movieRepository.findById(movie.id);

      await logActivity(req.user.id, 'movie_updated', 'movie', movie.id, { changes: Object.keys(updates) });
      return response.success(res, updated, 'Movie updated successfully');
    } catch (err) {
      next(err);
    }
  },

  async delete(req, res, next) {
    try {
      const movie = await movieRepository.findById(req.params.id);
      if (!movie) throw new NotFoundError('Movie not found');

      await movieRepository.delete(movie.id);
      await logActivity(req.user.id, 'movie_deleted', 'movie', movie.id, { title: movie.title });

      return response.success(res, null, 'Movie deleted successfully');
    } catch (err) {
      next(err);
    }
  },

  async getPopular(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const movies = await movieRepository.getPopular(limit);
      return response.success(res, movies);
    } catch (err) {
      next(err);
    }
  },

  async getRecent(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const movies = await movieRepository.getRecent(limit);
      return response.success(res, movies);
    } catch (err) {
      next(err);
    }
  },

  async getFeatured(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const movies = await movieRepository.getFeatured(limit);
      return response.success(res, movies);
    } catch (err) {
      next(err);
    }
  },

  async search(req, res, next) {
    try {
      const { q, category, page: p, limit: l } = req.query;
      if (!q || q.trim().length < 1) {
        throw new ValidationError('Search query is required');
      }

      const { page, limit } = paginate(p, l);
      const result = await movieRepository.search(q.trim(), { page, limit, category });

      return response.paginated(res, result.rows, { page, limit, total: result.total });
    } catch (err) {
      next(err);
    }
  },

  async getCategories(req, res, next) {
    try {
      const visibleOnly = req.query.visible !== 'false';
      const categories = await categoryRepository.findAll(visibleOnly);
      return response.success(res, categories);
    } catch (err) {
      next(err);
    }
  },

  async createCategory(req, res, next) {
    try {
      const existing = await categoryRepository.findBySlug(slugify(req.body.name));
      if (existing) throw new ValidationError('Category already exists');

      const id = await categoryRepository.create(req.body);
      const category = await categoryRepository.findById(id);
      return response.created(res, category, 'Category created successfully');
    } catch (err) {
      next(err);
    }
  },

  async updateCategory(req, res, next) {
    try {
      const category = await categoryRepository.findById(req.params.id);
      if (!category) throw new NotFoundError('Category not found');

      await categoryRepository.update(category.id, req.body);
      const updated = await categoryRepository.findById(category.id);
      return response.success(res, updated, 'Category updated successfully');
    } catch (err) {
      next(err);
    }
  },

  async deleteCategory(req, res, next) {
    try {
      const category = await categoryRepository.findById(req.params.id);
      if (!category) throw new NotFoundError('Category not found');

      await categoryRepository.delete(category.id);
      return response.success(res, null, 'Category deleted successfully');
    } catch (err) {
      next(err);
    }
  },

  async reorderCategories(req, res, next) {
    try {
      const { orders } = req.body;
      if (!Array.isArray(orders)) throw new ValidationError('Orders must be an array');

      for (const { id, order } of orders) {
        await categoryRepository.reorder(id, order);
      }

      return response.success(res, null, 'Categories reordered successfully');
    } catch (err) {
      next(err);
    }
  },

  async getLibrary(req, res, next) {
    try {
      const { page: p, limit: l } = req.query;
      const { page, limit } = paginate(p, l);
      const result = await libraryRepository.getUserLibrary(req.user.id, { page, limit });
      return response.paginated(res, result.rows, { page, limit, total: result.total });
    } catch (err) {
      next(err);
    }
  },

  async getContinueWatching(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const items = await libraryRepository.getContinueWatching(req.user.id, limit);
      return response.success(res, items);
    } catch (err) {
      next(err);
    }
  },

  async savePlaybackProgress(req, res, next) {
    try {
      const { movieId, positionSeconds, durationSeconds, completed } = req.body;

      const owned = await libraryRepository.isOwned(req.user.id, movieId);
      if (!owned) throw new NotFoundError('Movie not found in your library');

      await libraryRepository.savePlaybackProgress(req.user.id, movieId, positionSeconds, durationSeconds, completed);
      return response.success(res, null, 'Progress saved');
    } catch (err) {
      next(err);
    }
  },

  async getDownloadHistory(req, res, next) {
    try {
      const { page: p, limit: l } = req.query;
      const { page, limit } = paginate(p, l);
      const result = await libraryRepository.getDownloadHistory(req.user.id, { page, limit });
      return response.paginated(res, result.rows, { page, limit, total: result.total });
    } catch (err) {
      next(err);
    }
  },

  async getStreamHistory(req, res, next) {
    try {
      const { page: p, limit: l } = req.query;
      const { page, limit } = paginate(p, l);
      const result = await libraryRepository.getStreamHistory(req.user.id, { page, limit });
      return response.paginated(res, result.rows, { page, limit, total: result.total });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = movieController;
