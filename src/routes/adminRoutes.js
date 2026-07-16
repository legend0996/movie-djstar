const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');
const { uploadLimiter } = require('../middleware/rateLimiter');
const multer = require('multer');
const config = require('../config');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.upload.maxFileSize },
});

router.use(authenticate);

router.get('/movie-owner/dashboard', authorize('movie_owner', 'developer'), adminController.getMovieOwnerDashboard);

router.post('/movies/:id/poster', authorize('movie_owner', 'developer'), uploadLimiter, upload.single('poster'), adminController.uploadPoster);
router.post('/movies/:id/trailer', authorize('movie_owner', 'developer'), uploadLimiter, upload.single('trailer'), adminController.uploadTrailer);
router.post('/movies/:id/file', authorize('movie_owner', 'developer'), uploadLimiter, upload.single('movie'), adminController.uploadMovieFile);

router.get('/developer/dashboard', authorize('developer'), adminController.getDeveloperDashboard);
router.get('/developer/audit-logs', authorize('developer'), adminController.getAuditLogs);
router.get('/developer/analytics', authorize('developer'), adminController.getAnalytics);
router.get('/developer/revenue-reports', authorize('developer'), adminController.getRevenueReports);

router.get('/users', authorize('developer'), adminController.getUserManagement);
router.put('/users/:id/status', authorize('developer'), adminController.updateUserStatus);

router.get('/support/tickets', authorize('movie_owner', 'developer'), adminController.getSupportTickets);
router.put('/support/tickets/:id/status', authorize('movie_owner', 'developer'), adminController.updateTicketStatus);
router.post('/support/tickets/:id/reply', authorize('movie_owner', 'developer'), adminController.replyToTicket);

module.exports = router;
