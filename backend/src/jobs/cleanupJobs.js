const cron = require('node-cron');
const db = require('../config/database');
const config = require('../config');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');

function startScheduledJobs() {
  cron.schedule(config.jobs.cleanupSchedule, async () => {
    logger.info('Running scheduled cleanup job');

    try {
      const [expiredCodes] = await db.execute(
        `UPDATE verification_codes SET used_at = NOW()
         WHERE used_at IS NULL AND expires_at < NOW()`
      );
      if (expiredCodes.affectedRows > 0) {
        logger.info('Expired verification codes cleaned', { count: expiredCodes.affectedRows });
      }
    } catch (err) {
      logger.error('Failed to clean expired verification codes', { error: err.message });
    }

    try {
      const [expiredSessions] = await db.execute(
        `UPDATE user_sessions SET is_active = 0, revoked_at = NOW()
         WHERE is_active = 1 AND expires_at < NOW()`
      );
      if (expiredSessions.affectedRows > 0) {
        logger.info('Expired sessions cleaned', { count: expiredSessions.affectedRows });
      }
    } catch (err) {
      logger.error('Failed to clean expired sessions', { error: err.message });
    }

    try {
      const [expiredTransactions] = await db.execute(
        `UPDATE transactions SET status = 'cancelled', updated_at = NOW()
         WHERE status = 'processing' AND created_at < DATE_SUB(NOW(), INTERVAL 30 MINUTE)`
      );
      if (expiredTransactions.affectedRows > 0) {
        logger.info('Expired payment transactions cancelled', { count: expiredTransactions.affectedRows });
      }
    } catch (err) {
      logger.error('Failed to cancel expired payment transactions', { error: err.message });
    }

    try {
      const tempDir = config.upload.tempDir;
      if (fs.existsSync(tempDir)) {
        const files = fs.readdirSync(tempDir);
        let cleanedCount = 0;
        for (const file of files) {
          const filePath = path.join(tempDir, file);
          const stats = fs.statSync(filePath);
          if (stats.isFile() && Date.now() - stats.mtimeMs > 86400000) {
            fs.unlinkSync(filePath);
            cleanedCount++;
          }
        }
        if (cleanedCount > 0) {
          logger.info('Temporary upload files cleaned', { count: cleanedCount });
        }
      }
    } catch (err) {
      logger.error('Failed to clean temporary upload files', { error: err.message });
    }

    logger.info('Cleanup job completed');
  });

  cron.schedule('0 2 * * *', async () => {
    logger.info('Running daily analytics aggregation');

    try {
      await db.execute(`
        INSERT INTO platform_statistics (stat_date, total_users, new_users, total_movies,
          total_orders, total_revenue, developer_commission, owner_earnings,
          total_streams, total_downloads, active_users)
        SELECT
          CURDATE() - INTERVAL 1 DAY,
          (SELECT COUNT(*) FROM users WHERE deleted_at IS NULL),
          (SELECT COUNT(*) FROM users WHERE DATE(created_at) = CURDATE() - INTERVAL 1 DAY),
          (SELECT COUNT(*) FROM movies WHERE deleted_at IS NULL),
          (SELECT COUNT(*) FROM orders WHERE DATE(created_at) = CURDATE() - INTERVAL 1 DAY),
          (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE DATE(paid_at) = CURDATE() - INTERVAL 1 DAY AND payment_status = 'paid'),
          (SELECT COALESCE(SUM(developer_commission), 0) FROM revenue_records WHERE DATE(recorded_at) = CURDATE() - INTERVAL 1 DAY),
          (SELECT COALESCE(SUM(owner_earnings), 0) FROM revenue_records WHERE DATE(recorded_at) = CURDATE() - INTERVAL 1 DAY),
          (SELECT COUNT(*) FROM stream_log WHERE DATE(started_at) = CURDATE() - INTERVAL 1 DAY),
          (SELECT COUNT(*) FROM download_log WHERE DATE(created_at) = CURDATE() - INTERVAL 1 DAY),
          (SELECT COUNT(DISTINCT user_id) FROM user_activity_log WHERE DATE(created_at) = CURDATE() - INTERVAL 1 DAY)
        ON DUPLICATE KEY UPDATE
          total_users = VALUES(total_users),
          new_users = VALUES(new_users),
          total_movies = VALUES(total_movies),
          total_orders = VALUES(total_orders),
          total_revenue = VALUES(total_revenue),
          developer_commission = VALUES(developer_commission),
          owner_earnings = VALUES(owner_earnings),
          total_streams = VALUES(total_streams),
          total_downloads = VALUES(total_downloads),
          active_users = VALUES(active_users)
      `);
      logger.info('Daily analytics aggregation completed');
    } catch (err) {
      logger.error('Failed to aggregate analytics', { error: err.message });
    }
  });

  logger.info('Scheduled jobs initialized', {
    cleanupSchedule: config.jobs.cleanupSchedule,
    analyticsSchedule: '0 2 * * *',
  });
}

module.exports = { startScheduledJobs };
