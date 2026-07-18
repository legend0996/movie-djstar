const streamService = require('../services/streamService');
const response = require('../utils/response');

const streamController = {
  async streamMovie(req, res, next) {
    try {
      const range = req.headers.range;
      const result = await streamService.streamMovie(
        req.user.id,
        req.params.id,
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
      const result = await streamService.streamTrailer(req.params.id, range);

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
        req.params.id,
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
      const result = await streamService.getSignedDownloadUrl(req.user.id, req.params.id);
      return response.success(res, result);
    } catch (err) {
      next(err);
    }
  },
};

module.exports = streamController;
