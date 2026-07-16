const mysql = require('mysql2/promise');
const config = require('./index');
const logger = require('../utils/logger');

const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  database: config.db.name,
  user: config.db.user,
  password: config.db.password,
  connectionLimit: config.db.connectionLimit,
  waitForConnections: true,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  charset: 'utf8mb4',
  timezone: '+00:00',
});

pool.getConnection()
  .then(conn => {
    logger.info('Database connected successfully');
    conn.release();
  })
  .catch(err => {
    logger.error('Database connection failed', { error: err.message });
    process.exit(1);
  });

module.exports = pool;
