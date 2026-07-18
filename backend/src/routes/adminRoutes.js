const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');
const { uploadLimiter } = require('../middleware/rateLimiter');
const { uploadPoster, uploadTrailer, uploadMovie } = require('../middleware/upload');

router.use(authenticate);

router.get('/movie-owner/dashboard', authorize('movie_owner', 'developer'), adminController.getMovieOwnerDashboard);

router.post('/movies/:id/poster', authorize('movie_owner', 'developer'), uploadLimiter, uploadPoster, adminController.uploadPoster);
router.post('/movies/:id/trailer', authorize('movie_owner', 'developer'), uploadLimiter, uploadTrailer, adminController.uploadTrailer);
router.post('/movies/:id/file', authorize('movie_owner', 'developer'), uploadLimiter, uploadMovie, adminController.uploadMovieFile);

router.get('/developer/dashboard', authorize('developer'), adminController.getDeveloperDashboard);
router.get('/developer/audit-logs', authorize('developer'), adminController.getAuditLogs);
router.get('/developer/analytics', authorize('developer'), adminController.getAnalytics);
router.get('/developer/revenue-reports', authorize('developer'), adminController.getRevenueReports);

router.get('/users', authorize('developer'), adminController.getUserManagement);
router.put('/users/:id/status', authorize('developer'), adminController.updateUserStatus);
router.put('/users/:id', authorize('developer'), adminController.updateUser);

router.get('/support/tickets', authorize('movie_owner', 'developer'), adminController.getSupportTickets);
router.put('/support/tickets/:id/status', authorize('movie_owner', 'developer'), adminController.updateTicketStatus);
router.post('/support/tickets/:id/reply', authorize('movie_owner', 'developer'), adminController.replyToTicket);

module.exports = router;
