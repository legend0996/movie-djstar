const express = require('express');
const router = express.Router();
const movieController = require('../controllers/movieController');
const reviewController = require('../controllers/reviewController');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const {
  createMovieSchema,
  updateMovieSchema,
  categorySchema,
  updateCategorySchema,
  searchSchema,
} = require('../validators/movieValidators');
const {
  createReviewSchema,
  updateReviewSchema,
} = require('../validators/reviewValidators');

router.get('/', optionalAuth, movieController.list);
router.get('/popular', movieController.getPopular);
router.get('/recent', movieController.getRecent);
router.get('/featured', movieController.getFeatured);
router.get('/search', validate(searchSchema, 'query'), movieController.search);
router.get('/categories', movieController.getCategories);
router.get('/slug/:slug', optionalAuth, movieController.getBySlug);
router.get('/:id', optionalAuth, movieController.getById);

router.use(authenticate);

router.post('/', authorize('movie_owner', 'developer'), validate(createMovieSchema), movieController.create);
router.put('/:id', authorize('movie_owner', 'developer'), validate(updateMovieSchema), movieController.update);
router.delete('/:id', authorize('movie_owner', 'developer'), movieController.delete);

router.post('/categories', authorize('movie_owner', 'developer'), validate(categorySchema), movieController.createCategory);
router.put('/categories/:id', authorize('movie_owner', 'developer'), validate(updateCategorySchema), movieController.updateCategory);
router.delete('/categories/:id', authorize('movie_owner', 'developer'), movieController.deleteCategory);
router.put('/categories/reorder', authorize('movie_owner', 'developer'), movieController.reorderCategories);

router.get('/library/list', movieController.getLibrary);
router.get('/library/continue-watching', movieController.getContinueWatching);
router.post('/library/progress', movieController.savePlaybackProgress);
router.get('/library/downloads', movieController.getDownloadHistory);
router.get('/library/streams', movieController.getStreamHistory);

router.get('/:movieId/reviews', reviewController.getMovieReviews);
router.post('/:movieId/reviews', validate(createReviewSchema), reviewController.create);
router.get('/:movieId/reviews/mine', reviewController.getUserReview);
router.put('/reviews/:id', validate(updateReviewSchema), reviewController.update);
router.delete('/reviews/:id', reviewController.delete);

module.exports = router;
