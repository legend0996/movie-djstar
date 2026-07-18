-- ============================================================
-- Backup / Restore Helper Script
-- ============================================================

-- 1) mysqldump example (run from shell, not inside mysql):
--
--    # Full backup
--    mysqldump -u root -p dj_star_original_movies > /backups/djstar_full_$(date +%Y%m%d_%H%M%S).sql
--
--    # Single table backup
--    mysqldump -u root -p dj_star_original_movies stream_log > /backups/stream_log_$(date +%Y%m%d).sql
--
--    # Backup without data (schema only)
--    mysqldump -u root -p --no-data dj_star_original_movies > /backups/djstar_schema.sql
--
--    # Restore
--    mysql -u root -p dj_star_original_movies < /backups/djstar_full_20250101_120000.sql

-- 2) Archive old stream_log records into a monthly archive table
CREATE TABLE IF NOT EXISTS stream_log_archive LIKE stream_log;

INSERT INTO stream_log_archive
SELECT * FROM stream_log
WHERE started_at < DATE_SUB(NOW(), INTERVAL 3 MONTH);

DELETE FROM stream_log
WHERE started_at < DATE_SUB(NOW(), INTERVAL 3 MONTH);

-- 3) Archive old user_activity_log records
CREATE TABLE IF NOT EXISTS user_activity_log_archive LIKE user_activity_log;

INSERT INTO user_activity_log_archive
SELECT * FROM user_activity_log
WHERE created_at < DATE_SUB(NOW(), INTERVAL 6 MONTH);

DELETE FROM user_activity_log
WHERE created_at < DATE_SUB(NOW(), INTERVAL 6 MONTH);

-- 4) Partition maintenance suggestions
--
--    For large tables (stream_log, user_activity_log, orders) consider
--    RANGE partitioning on date columns:
--
--    ALTER TABLE stream_log
--    PARTITION BY RANGE (YEAR(started_at)) (
--        PARTITION p2023 VALUES LESS THAN (2024),
--        PARTITION p2024 VALUES LESS THAN (2025),
--        PARTITION p2025 VALUES LESS THAN (2026),
--        PARTITION p2026 VALUES LESS THAN (2027),
--        PARTITION p_future VALUES LESS THAN MAXVALUE
--    );
--
--    To add a new partition for the coming year:
--    ALTER TABLE stream_log REORGANIZE PARTITION p_future INTO (
--        PARTITION p2027 VALUES LESS THAN (2028),
--        PARTITION p_future VALUES LESS THAN MAXVALUE
--    );
--
--    To drop an old partition:
--    ALTER TABLE stream_log DROP PARTITION p2023;

-- 5) Data integrity check (run periodically)
--    CHECK TABLE stream_log, orders, order_items, transactions, user_activity_log;
