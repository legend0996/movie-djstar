const http = require('http');
const app = require('./app');
const config = require('./config');
const logger = require('./utils/logger');
const prisma = require('./config/database');
const { initializeSocket } = require('./sockets');
const { startScheduledJobs } = require('./jobs/cleanupJobs');

async function startServer() {
  try {
    const httpServer = http.createServer(app);

    initializeSocket(httpServer);

    const server = httpServer.listen(config.app.port, () => {
      logger.info(`${config.app.name} API server started`, {
        port: config.app.port,
        environment: config.env,
        url: config.app.url,
      });

      startScheduledJobs();
    });

    const gracefulShutdown = async (signal) => {
      logger.info(`${signal} received. Shutting down gracefully...`);

      const io = require('./sockets');
      if (io.getIO) {
        try {
          io.getIO().close();
          logger.info('WebSocket server closed');
        } catch (e) {
          // Socket.io not initialized
        }
      }

      server.close(async () => {
        logger.info('HTTP server closed');
        await prisma.$disconnect();
        logger.info('Database connections closed');
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
      process.exit(1);
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
