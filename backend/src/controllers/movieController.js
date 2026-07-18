const movieService = require('../services/movieService');
const response = require('../utils/response');
const { paginate } = require('../utils/helpers');

const movieController = {
  async list(req, res, next) {
    try {
      const { page: p, limit: l, category, status, search, sort, featured } = req.query;
      const { page, limit } = paginate(p, l);
      const result = await movieService.list({
        page,
        limit,
        category,
        status,
        search,
        sort,
        featured,
        userRole: req.user?.role,
      });
      return response.paginated(res, result.rows, { page, limit, total: result.total });
    } catch (err) {
      next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const movie = await movieService.getMovie(req.params.id, req.user?.id, req.user?.role);
      return response.success(res, movie);
    } catch (err) {
      next(err);
    }
  },

  async getBySlug(req, res, next) {
    try {
      const movie = await movieService.getMovieBySlug(req.params.slug, req.user?.id, req.user?.role);
      return response.success(res, movie);
    } catch (err) {
      next(err);
    }
  },

  async create(req, res, next) {
    try {
      const movie = await movieService.create(req.body, req.user.id);
      return response.created(res, movie, 'Movie created successfully');
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const movie = await movieService.update(req.params.id, req.body, req.user.id);
      return response.success(res, movie, 'Movie updated successfully');
    } catch (err) {
      next(err);
    }
  },

  async delete(req, res, next) {
    try {
      await movieService.delete(req.params.id, req.user.id);
      return response.success(res, null, 'Movie deleted successfully');
    } catch (err) {
      next(err);
    }
  },

  async getPopular(req, res, next) {
    try {
      const movies = await movieService.getPopular(req.query.limit);
      return response.success(res, movies);
    } catch (err) {
      next(err);
    }
  },

  async getRecent(req, res, next) {
    try {
      const movies = await movieService.getRecent(req.query.limit);
      return response.success(res, movies);
    } catch (err) {
      next(err);
    }
  },

  async getFeatured(req, res, next) {
    try {
      const movies = await movieService.getFeatured(req.query.limit);
      return response.success(res, movies);
    } catch (err) {
      next(err);
    }
  },

  async search(req, res, next) {
    try {
      const { page: p, limit: l, category } = req.query;
      const { page, limit } = paginate(p, l);
      const result = await movieService.searchMovies(req.query.q, { page, limit, category });
      return response.paginated(res, result.rows, { page, limit, total: result.total });
    } catch (err) {
      next(err);
    }
  },

  async getCategories(req, res, next) {
    try {
      const visibleOnly = req.query.visible !== 'false';
      const categories = await movieService.getCategories(visibleOnly);
      return response.success(res, categories);
    } catch (err) {
      next(err);
    }
  },

  async createCategory(req, res, next) {
    try {
      const category = await movieService.createCategory(req.body);
      return response.created(res, category, 'Category created successfully');
    } catch (err) {
      next(err);
    }
  },

  async updateCategory(req, res, next) {
    try {
      const category = await movieService.updateCategory(req.params.id, req.body);
      return response.success(res, category, 'Category updated successfully');
    } catch (err) {
      next(err);
    }
  },

  async deleteCategory(req, res, next) {
    try {
      await movieService.deleteCategory(req.params.id);
      return response.success(res, null, 'Category deleted successfully');
    } catch (err) {
      next(err);
    }
  },

  async reorderCategories(req, res, next) {
    try {
      await movieService.reorderCategories(req.body.orders);
      return response.success(res, null, 'Categories reordered successfully');
    } catch (err) {
      next(err);
    }
  },

  async getLibrary(req, res, next) {
    try {
      const { page: p, limit: l } = req.query;
      const { page, limit } = paginate(p, l);
      const result = await movieService.getLibrary(req.user.id, { page, limit });
      return response.paginated(res, result.rows, { page, limit, total: result.total });
    } catch (err) {
      next(err);
    }
  },

  async getContinueWatching(req, res, next) {
    try {
      const items = await movieService.getContinueWatching(req.user.id, req.query.limit);
      return response.success(res, items);
    } catch (err) {
      next(err);
    }
  },

  async savePlaybackProgress(req, res, next) {
    try {
      const { movieId, positionSeconds, durationSeconds, completed } = req.body;
      await movieService.savePlaybackProgress(req.user.id, movieId, positionSeconds, durationSeconds, completed);
      return response.success(res, null, 'Progress saved');
    } catch (err) {
      next(err);
    }
  },

  async getDownloadHistory(req, res, next) {
    try {
      const { page: p, limit: l } = req.query;
      const { page, limit } = paginate(p, l);
      const result = await movieService.getDownloadHistory(req.user.id, { page, limit });
      return response.paginated(res, result.rows, { page, limit, total: result.total });
    } catch (err) {
      next(err);
    }
  },

  async getStreamHistory(req, res, next) {
    try {
      const { page: p, limit: l } = req.query;
      const { page, limit } = paginate(p, l);
      const result = await movieService.getStreamHistory(req.user.id, { page, limit });
      return response.paginated(res, result.rows, { page, limit, total: result.total });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = movieController;
