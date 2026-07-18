const multer = require('multer');
const config = require('../config');
const { MIME_TYPES } = require('../constants');
const { AppError } = require('../utils/errors');

const storage = multer.memoryStorage();

function fileFilter(allowedMimeTypes) {
  return (req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError(
        `Invalid file type. Allowed types: ${allowedMimeTypes.join(', ')}`,
        400,
        'INVALID_FILE_TYPE',
        [{ field: file.fieldname, message: `Received: ${file.mimetype}` }],
      ));
    }
  };
}

const uploadPoster = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter(MIME_TYPES.POSTER),
}).single('poster');

const uploadTrailer = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: fileFilter(MIME_TYPES.TRAILER),
}).single('trailer');

const uploadMovie = multer({
  storage,
  limits: { fileSize: config.upload.maxFileSize },
  fileFilter: fileFilter(MIME_TYPES.MOVIE),
}).single('movie');

function wrapMulter(middleware) {
  return (req, res, next) => {
    middleware(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new AppError('File size exceeds the maximum allowed size', 400, 'FILE_TOO_LARGE', [{ field: err.field, message: `Max size: ${config.upload.maxFileSize} bytes` }]));
        }
        return next(new AppError(`Upload error: ${err.message}`, 400, 'UPLOAD_ERROR', [{ field: err.field, message: err.message }]));
      }
      if (err) {
        return next(err);
      }
      next();
    });
  };
}

module.exports = { uploadPoster: (req, res, next) => wrapMulter(uploadPoster)(req, res, next), uploadTrailer: (req, res, next) => wrapMulter(uploadTrailer)(req, res, next), uploadMovie: (req, res, next) => wrapMulter(uploadMovie)(req, res, next) };
