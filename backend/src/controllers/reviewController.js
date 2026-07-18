const reviewService = require('../services/reviewService');
const response = require('../utils/response');
const { paginate } = require('../utils/helpers');

const reviewController = {
  async create(req, res, next) {
    try {
      const { movieId, rating, comment } = req.body;
      const review = await reviewService.create(req.user.id, movieId, rating, comment);
      return response.created(res, review, 'Review submitted successfully');
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const { rating, comment } = req.body;
      const review = await reviewService.update(req.user.id, parseInt(req.params.id), rating, comment);
      return response.success(res, review, 'Review updated successfully');
    } catch (err) {
      next(err);
    }
  },

  async delete(req, res, next) {
    try {
      await reviewService.delete(req.user.id, parseInt(req.params.id));
      return response.success(res, null, 'Review deleted successfully');
    } catch (err) {
      next(err);
    }
  },

  async getMovieReviews(req, res, next) {
    try {
      const { page: p, limit: l } = req.query;
      const { page, limit } = paginate(p, l);
      const result = await reviewService.getMovieReviews(parseInt(req.params.movieId), { page, limit });
      return response.paginated(res, result.rows, { page, limit, total: result.total });
    } catch (err) {
      next(err);
    }
  },

  async getUserReview(req, res, next) {
    try {
      const review = await reviewService.getUserReview(req.user.id, parseInt(req.params.movieId));
      return response.success(res, review);
    } catch (err) {
      next(err);
    }
  },
};

module.exports = reviewController;
