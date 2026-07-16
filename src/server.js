const app = require('./app');
const config = require('./config');
const logger = require('./utils/logger');
const { startScheduledJobs } = require('./jobs/cleanupJobs');

async function startServer() {
  try {
    const server = app.listen(config.app.port, () => {
      logger.info(`${config.app.name} API server started`, {
        port: config.app.port,
        environment: config.env,
        url: config.app.url,
      });

      startScheduledJobs();
    });

    const gracefulShutdown = (signal) => {
      logger.info(`${signal} received. Shutting down gracefully...`);
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });

      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    process.on('uncaughtException', (err) => {
      logger.error('Uncaught exception', { error: err.message, stack: err.stack });
      gracefulShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled rejection', { reason: reason?.message, promise });
    });
  } catch (err) {
    logger.error('Failed to start server', { error: err.message });
    process.exit(1);
  }
}

startServer();
