const cors = require('cors');
const config = require('../config');

const origin = config.cors.origin.split(',').map(s => s.trim());

const corsOptions = {
  origin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

const corsMiddleware = cors(corsOptions);

module.exports = corsMiddleware;
