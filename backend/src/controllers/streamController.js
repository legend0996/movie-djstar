const streamService = require('../services/streamService');
const response = require('../utils/response');

function parseIdParam(value) {
  const id = parseInt(value, 10);
  if (isNaN(id)) {throw Object.assign(new Error('Invalid ID'), { statusCode: 400, errorCode: 'VALIDATION_ERROR' });}
  return id;
}

const streamController = {
  async streamMovie(req, res, next) {
    try {
      const range = req.headers.range;
      const result = await streamService.streamMovie(
        req.user.id,
        parseIdParam(req.params.id),
        range,
        req.ip,
        req.headers['user-agent'],
      );

      res.writeHead(result.statusCode, result.headers);
      result.streamData.Body.pipe(res);
    } catch (err) {
      next(err);
    }
  },

  async streamTrailer(req, res, next) {
    try {
      const range = req.headers.range;
      const result = await streamService.streamTrailer(parseIdParam(req.params.id), range);

      res.writeHead(result.statusCode, result.headers);
      result.streamData.Body.pipe(res);
    } catch (err) {
      next(err);
    }
  },

  async downloadMovie(req, res, next) {
    try {
      const result = await streamService.downloadMovie(
        req.user.id,
        parseIdParam(req.params.id),
        req.ip,
        req.headers['user-agent'],
      );

      res.writeHead(200, result.headers);
      result.streamData.Body.pipe(res);
    } catch (err) {
      next(err);
    }
  },

  async getSignedDownloadUrl(req, res, next) {
    try {
      const result = await streamService.getSignedDownloadUrl(req.user.id, parseIdParam(req.params.id));
      return response.success(res, result);
    } catch (err) {
      next(err);
    }
  },
};

module.exports = streamController;
