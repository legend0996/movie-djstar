const reviewRepository = require('../repositories/reviewRepository');
const movieRepository = require('../repositories/movieRepository');
const libraryRepository = require('../repositories/libraryRepository');
const { logActivity } = require('../middleware/activityLogger');
const { NotFoundError, ValidationError, ConflictError } = require('../utils/errors');
const { MOVIE_STATUS } = require('../constants');
const logger = require('../utils/logger');

const reviewService = {
  async create(userId, movieId, rating, comment) {
    const movie = await movieRepository.findById(movieId);
    if (!movie || movie.status !== MOVIE_STATUS.PUBLISHED) {
      throw new NotFoundError('Movie not found');
    }

    const existing = await reviewRepository.findByUserAndMovie(userId, movieId);
    if (existing) {
      throw new ConflictError('You have already reviewed this movie');
    }

    if (!rating || rating < 1 || rating > 5) {
      throw new ValidationError('Rating must be between 1 and 5');
    }

    const reviewId = await reviewRepository.create({ userId, movieId, rating, comment });
    await logActivity(userId, 'review_created', 'review', reviewId, { movieId, rating });

    return reviewRepository.findById(reviewId);
  },

  async update(userId, reviewId, rating, comment) {
    const review = await reviewRepository.findById(reviewId);
    if (!review) {throw new NotFoundError('Review not found');}
    if (review.user.id !== userId) {
      throw new ValidationError('You can only edit your own reviews');
    }

    if (rating !== undefined && (rating < 1 || rating > 5)) {
      throw new ValidationError('Rating must be between 1 and 5');
    }

    await reviewRepository.update(reviewId, { rating, comment });
    await logActivity(userId, 'review_updated', 'review', reviewId, { rating });

    return reviewRepository.findById(reviewId);
  },

  async delete(userId, reviewId) {
    const review = await reviewRepository.findById(reviewId);
    if (!review) {throw new NotFoundError('Review not found');}
    if (review.user.id !== userId) {
      throw new ValidationError('You can only delete your own reviews');
    }

    await reviewRepository.delete(reviewId);
    await logActivity(userId, 'review_deleted', 'review', reviewId, { movieId: review.movieId });
  },

  async getMovieReviews(movieId, { page, limit } = {}) {
    const movie = await movieRepository.findById(movieId);
    if (!movie) {throw new NotFoundError('Movie not found');}

    return reviewRepository.findByMovie(movieId, { page, limit });
  },

  async getUserReview(userId, movieId) {
    return reviewRepository.findByUserAndMovie(userId, movieId);
  },

  async attachReviewStats(movies) {
    if (!movies || movies.length === 0) {return movies;}
    const movieIds = movies.map(m => m.id);
    const statsMap = await reviewRepository.getMoviesStats(movieIds);
    return movies.map(m => ({
      ...m,
      averageRating: statsMap[m.id]?.averageRating || 0,
      reviewCount: statsMap[m.id]?.reviewCount || 0,
    }));
  },

  async attachSingleMovieStats(movie) {
    if (!movie) {return movie;}
    const stats = await reviewRepository.getMovieStats(movie.id);
    return {
      ...movie,
      averageRating: stats.averageRating,
      reviewCount: stats.reviewCount,
    };
  },
};

module.exports = reviewService;
