const express = require('express');
const router = express.Router();
const streamController = require('../controllers/streamController');
const { authenticate } = require('../middleware/auth');

router.get('/trailer/:id', streamController.streamTrailer);

router.use(authenticate);
router.get('/movie/:id', streamController.streamMovie);
router.get('/download/:id', streamController.downloadMovie);
router.get('/signed-url/:id', streamController.getSignedDownloadUrl);

module.exports = router;
