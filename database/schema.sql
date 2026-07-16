-- =============================================================================
-- DJ Star Original Movies - Complete MySQL Database Schema
-- =============================================================================
-- This schema is designed for production use with thousands of users.
-- It supports movies, series, categories, users, payments, streaming,
-- downloads, analytics, auditing, and future expansion.
-- =============================================================================

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS dj_star_movies
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE dj_star_movies;

-- =============================================================================
-- 1. ROLES
-- =============================================================================
CREATE TABLE IF NOT EXISTS roles (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  slug VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(255) DEFAULT NULL,
  is_system TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_roles_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 2. USERS
-- =============================================================================
CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  role_id INT UNSIGNED NOT NULL,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20) DEFAULT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) DEFAULT NULL,
  last_name VARCHAR(100) DEFAULT NULL,
  avatar_url VARCHAR(500) DEFAULT NULL,
  status ENUM('active','unverified','suspended','disabled','deleted') NOT NULL DEFAULT 'unverified',
  email_verified_at TIMESTAMP NULL DEFAULT NULL,
  phone_verified_at TIMESTAMP NULL DEFAULT NULL,
  last_login_at TIMESTAMP NULL DEFAULT NULL,
  last_login_ip VARCHAR(45) DEFAULT NULL,
  login_attempts INT UNSIGNED NOT NULL DEFAULT 0,
  locked_until TIMESTAMP NULL DEFAULT NULL,
  password_changed_at TIMESTAMP NULL DEFAULT NULL,
  two_factor_enabled TINYINT(1) NOT NULL DEFAULT 0,
  two_factor_secret VARCHAR(255) DEFAULT NULL,
  metadata JSON DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  INDEX idx_users_email (email),
  INDEX idx_users_username (username),
  INDEX idx_users_status (status),
  INDEX idx_users_role (role_id),
  INDEX idx_users_created (created_at),
  CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 3. VERIFICATION CODES
-- =============================================================================
CREATE TABLE IF NOT EXISTS verification_codes (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  code VARCHAR(6) NOT NULL,
  type ENUM('email_verification','password_reset','email_change','phone_verification') NOT NULL,
  purpose VARCHAR(100) DEFAULT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP NULL DEFAULT NULL,
  attempts INT UNSIGNED NOT NULL DEFAULT 0,
  max_attempts INT UNSIGNED NOT NULL DEFAULT 5,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_vc_user (user_id),
  INDEX idx_vc_code (code),
  INDEX idx_vc_type (type),
  INDEX idx_vc_expires (expires_at),
  INDEX idx_vc_used (used_at),
  CONSTRAINT fk_vc_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 4. USER SESSIONS
-- =============================================================================
CREATE TABLE IF NOT EXISTS user_sessions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  token VARCHAR(500) NOT NULL,
  refresh_token VARCHAR(500) DEFAULT NULL,
  ip_address VARCHAR(45) DEFAULT NULL,
  user_agent VARCHAR(500) DEFAULT NULL,
  device_type VARCHAR(50) DEFAULT NULL,
  device_name VARCHAR(255) DEFAULT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  last_activity_at TIMESTAMP NULL DEFAULT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revoked_at TIMESTAMP NULL DEFAULT NULL,
  INDEX idx_us_user (user_id),
  INDEX idx_us_token (token(255)),
  INDEX idx_us_active (is_active),
  INDEX idx_us_expires (expires_at),
  CONSTRAINT fk_us_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 5. USER ACTIVITY LOG
-- =============================================================================
CREATE TABLE IF NOT EXISTS user_activity_log (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED DEFAULT NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) DEFAULT NULL,
  entity_id INT UNSIGNED DEFAULT NULL,
  ip_address VARCHAR(45) DEFAULT NULL,
  user_agent VARCHAR(500) DEFAULT NULL,
  details JSON DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ual_user (user_id),
  INDEX idx_ual_action (action),
  INDEX idx_ual_entity (entity_type, entity_id),
  INDEX idx_ual_created (created_at),
  CONSTRAINT fk_ual_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 6. CATEGORIES
-- =============================================================================
CREATE TABLE IF NOT EXISTS categories (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT DEFAULT NULL,
  parent_id INT UNSIGNED DEFAULT NULL,
  icon VARCHAR(255) DEFAULT NULL,
  display_order INT NOT NULL DEFAULT 0,
  is_visible TINYINT(1) NOT NULL DEFAULT 1,
  is_series TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_cat_slug (slug),
  INDEX idx_cat_parent (parent_id),
  INDEX idx_cat_visible (is_visible),
  INDEX idx_cat_order (display_order),
  CONSTRAINT fk_cat_parent FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 7. MOVIES
-- =============================================================================
CREATE TABLE IF NOT EXISTS movies (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id INT UNSIGNED DEFAULT NULL,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT DEFAULT NULL,
  short_description VARCHAR(500) DEFAULT NULL,
  duration INT UNSIGNED DEFAULT NULL COMMENT 'Duration in seconds',
  release_year YEAR DEFAULT NULL,
  language VARCHAR(50) DEFAULT 'English',
  quality VARCHAR(20) DEFAULT 'HD',
  age_rating VARCHAR(10) DEFAULT NULL,
  director VARCHAR(255) DEFAULT NULL,
  cast_members JSON DEFAULT NULL,
  poster_url VARCHAR(500) DEFAULT NULL,
  cover_url VARCHAR(500) DEFAULT NULL,
  trailer_url VARCHAR(500) DEFAULT NULL,
  thumbnail_url VARCHAR(500) DEFAULT NULL,
  movie_url VARCHAR(500) DEFAULT NULL COMMENT 'Cloudflare R2 object key',
  movie_size BIGINT UNSIGNED DEFAULT NULL COMMENT 'File size in bytes',
  movie_format VARCHAR(20) DEFAULT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  is_free TINYINT(1) NOT NULL DEFAULT 0,
  is_featured TINYINT(1) NOT NULL DEFAULT 0,
  status ENUM('draft','published','hidden','archived','unavailable') NOT NULL DEFAULT 'draft',
  is_series TINYINT(1) NOT NULL DEFAULT 0,
  series_id INT UNSIGNED DEFAULT NULL,
  episode_number INT UNSIGNED DEFAULT NULL,
  season_number INT UNSIGNED DEFAULT NULL,
  total_views INT UNSIGNED NOT NULL DEFAULT 0,
  total_purchases INT UNSIGNED NOT NULL DEFAULT 0,
  total_streams INT UNSIGNED NOT NULL DEFAULT 0,
  total_downloads INT UNSIGNED NOT NULL DEFAULT 0,
  completion_rate DECIMAL(5,2) DEFAULT 0.00,
  popularity_score DECIMAL(10,2) DEFAULT 0.00,
  metadata JSON DEFAULT NULL,
  published_at TIMESTAMP NULL DEFAULT NULL,
  created_by INT UNSIGNED DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  INDEX idx_movies_slug (slug),
  INDEX idx_movies_status (status),
  INDEX idx_movies_category (category_id),
  INDEX idx_movies_series (series_id),
  INDEX idx_movies_featured (is_featured),
  INDEX idx_movies_popularity (popularity_score DESC),
  INDEX idx_movies_created (created_at DESC),
  INDEX idx_movies_published (published_at DESC),
  INDEX idx_movies_price (price),
  INDEX idx_movies_search (title),
  FULLTEXT INDEX ft_movies_search (title, description, short_description),
  CONSTRAINT fk_movies_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  CONSTRAINT fk_movies_series FOREIGN KEY (series_id) REFERENCES movies(id) ON DELETE SET NULL,
  CONSTRAINT fk_movies_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 8. MOVIE TAGS (for future expandability)
-- =============================================================================
CREATE TABLE IF NOT EXISTS movie_tags (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_mt_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 9. MOVIE TAG PIVOT
-- =============================================================================
CREATE TABLE IF NOT EXISTS movie_tag_pivot (
  movie_id INT UNSIGNED NOT NULL,
  tag_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (movie_id, tag_id),
  INDEX idx_mtp_tag (tag_id),
  CONSTRAINT fk_mtp_movie FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
  CONSTRAINT fk_mtp_tag FOREIGN KEY (tag_id) REFERENCES movie_tags(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 10. USER LIBRARY (owned movies)
-- =============================================================================
CREATE TABLE IF NOT EXISTS user_library (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  movie_id INT UNSIGNED NOT NULL,
  order_id INT UNSIGNED DEFAULT NULL,
  purchase_price DECIMAL(10,2) NOT NULL,
  is_available TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_library_user_movie (user_id, movie_id),
  INDEX idx_ul_user (user_id),
  INDEX idx_ul_movie (movie_id),
  CONSTRAINT fk_ul_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_ul_movie FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 11. PLAYBACK PROGRESS (Continue Watching)
-- =============================================================================
CREATE TABLE IF NOT EXISTS playback_progress (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  movie_id INT UNSIGNED NOT NULL,
  position_seconds INT UNSIGNED NOT NULL DEFAULT 0,
  duration_seconds INT UNSIGNED DEFAULT NULL,
  completed TINYINT(1) NOT NULL DEFAULT 0,
  last_watched_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_pp_user_movie (user_id, movie_id),
  INDEX idx_pp_user (user_id),
  INDEX idx_pp_movie (movie_id),
  INDEX idx_pp_last_watched (last_watched_at DESC),
  CONSTRAINT fk_pp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_pp_movie FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 12. DOWNLOAD LOG
-- =============================================================================
CREATE TABLE IF NOT EXISTS download_log (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  movie_id INT UNSIGNED NOT NULL,
  ip_address VARCHAR(45) DEFAULT NULL,
  user_agent VARCHAR(500) DEFAULT NULL,
  download_size BIGINT UNSIGNED DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_dl_user (user_id),
  INDEX idx_dl_movie (movie_id),
  INDEX idx_dl_created (created_at),
  CONSTRAINT fk_dl_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_dl_movie FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 13. STREAM LOG
-- =============================================================================
CREATE TABLE IF NOT EXISTS stream_log (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  movie_id INT UNSIGNED NOT NULL,
  ip_address VARCHAR(45) DEFAULT NULL,
  user_agent VARCHAR(500) DEFAULT NULL,
  bytes_streamed BIGINT UNSIGNED DEFAULT 0,
  started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP NULL DEFAULT NULL,
  INDEX idx_sl_user (user_id),
  INDEX idx_sl_movie (movie_id),
  INDEX idx_sl_started (started_at),
  CONSTRAINT fk_sl_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_sl_movie FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 14. TRANSACTIONS (Payment records)
-- =============================================================================
CREATE TABLE IF NOT EXISTS transactions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  order_id INT UNSIGNED DEFAULT NULL,
  transaction_reference VARCHAR(100) DEFAULT NULL UNIQUE,
  merchant_request_id VARCHAR(100) DEFAULT NULL,
  checkout_request_id VARCHAR(100) DEFAULT NULL,
  phone_number VARCHAR(20) DEFAULT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'KES',
  status ENUM('pending','processing','successful','failed','cancelled','expired','reversed') NOT NULL DEFAULT 'pending',
  payment_method VARCHAR(50) DEFAULT 'mpesa_buy_goods',
  payment_provider VARCHAR(50) DEFAULT 'safaricom',
  result_code VARCHAR(20) DEFAULT NULL,
  result_description TEXT DEFAULT NULL,
  mpesa_receipt VARCHAR(100) DEFAULT NULL,
  transaction_date TIMESTAMP NULL DEFAULT NULL,
  callback_received_at TIMESTAMP NULL DEFAULT NULL,
  callback_data JSON DEFAULT NULL,
  metadata JSON DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_txn_user (user_id),
  INDEX idx_txn_order (order_id),
  INDEX idx_txn_reference (transaction_reference),
  INDEX idx_txn_merchant (merchant_request_id),
  INDEX idx_txn_checkout (checkout_request_id),
  INDEX idx_txn_status (status),
  INDEX idx_txn_created (created_at),
  CONSTRAINT fk_txn_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 15. ORDERS
-- =============================================================================
CREATE TABLE IF NOT EXISTS orders (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  order_number VARCHAR(50) NOT NULL UNIQUE,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  currency VARCHAR(10) NOT NULL DEFAULT 'KES',
  status ENUM('pending','processing','completed','failed','refunded','partially_refunded') NOT NULL DEFAULT 'pending',
  payment_status ENUM('pending','paid','failed','refunded') NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMP NULL DEFAULT NULL,
  notes TEXT DEFAULT NULL,
  metadata JSON DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_orders_user (user_id),
  INDEX idx_orders_number (order_number),
  INDEX idx_orders_status (status),
  INDEX idx_orders_created (created_at),
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 16. ORDER ITEMS
-- =============================================================================
CREATE TABLE IF NOT EXISTS order_items (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id INT UNSIGNED NOT NULL,
  movie_id INT UNSIGNED NOT NULL,
  item_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_oi_order (order_id),
  INDEX idx_oi_movie (movie_id),
  CONSTRAINT fk_oi_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_oi_movie FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 17. RECEIPTS
-- =============================================================================
CREATE TABLE IF NOT EXISTS receipts (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  receipt_number VARCHAR(50) NOT NULL UNIQUE,
  receipt_data JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_rec_order (order_id),
  INDEX idx_rec_user (user_id),
  INDEX idx_rec_number (receipt_number),
  CONSTRAINT fk_rec_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_rec_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 18. REVENUE TRACKING
-- =============================================================================
CREATE TABLE IF NOT EXISTS revenue_records (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id INT UNSIGNED NOT NULL,
  transaction_id INT UNSIGNED DEFAULT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  developer_commission DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  owner_earnings DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  commission_percentage DECIMAL(5,2) NOT NULL DEFAULT 40.00,
  currency VARCHAR(10) NOT NULL DEFAULT 'KES',
  recorded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_rv_order (order_id),
  INDEX idx_rv_recorded (recorded_at),
  INDEX idx_rv_transaction (transaction_id),
  CONSTRAINT fk_rv_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_rv_transaction FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 19. AUDIT LOGS
-- =============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED DEFAULT NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) DEFAULT NULL,
  entity_id INT UNSIGNED DEFAULT NULL,
  old_values JSON DEFAULT NULL,
  new_values JSON DEFAULT NULL,
  ip_address VARCHAR(45) DEFAULT NULL,
  user_agent VARCHAR(500) DEFAULT NULL,
  details TEXT DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_al_user (user_id),
  INDEX idx_al_action (action),
  INDEX idx_al_entity (entity_type, entity_id),
  INDEX idx_al_created (created_at),
  CONSTRAINT fk_al_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 20. SUPPORT TICKETS
-- =============================================================================
CREATE TABLE IF NOT EXISTS support_tickets (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  ticket_number VARCHAR(20) NOT NULL UNIQUE,
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  priority ENUM('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
  status ENUM('open','in_progress','waiting_on_customer','resolved','closed') NOT NULL DEFAULT 'open',
  assigned_to INT UNSIGNED DEFAULT NULL,
  resolved_at TIMESTAMP NULL DEFAULT NULL,
  closed_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_st_user (user_id),
  INDEX idx_st_status (status),
  INDEX idx_st_priority (priority),
  INDEX idx_st_assigned (assigned_to),
  INDEX idx_st_created (created_at),
  CONSTRAINT fk_st_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_st_assigned FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 21. SUPPORT TICKET REPLIES
-- =============================================================================
CREATE TABLE IF NOT EXISTS support_ticket_replies (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ticket_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  message TEXT NOT NULL,
  is_staff TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_str_ticket (ticket_id),
  INDEX idx_str_user (user_id),
  CONSTRAINT fk_str_ticket FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE,
  CONSTRAINT fk_str_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 22. NOTIFICATIONS
-- =============================================================================
CREATE TABLE IF NOT EXISTS notifications (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED DEFAULT NULL COMMENT 'NULL for system-wide notifications',
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSON DEFAULT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  read_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_notif_user (user_id),
  INDEX idx_notif_type (type),
  INDEX idx_notif_read (is_read),
  INDEX idx_notif_created (created_at),
  CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 23. SYSTEM CONFIGURATION
-- =============================================================================
CREATE TABLE IF NOT EXISTS system_configurations (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  config_key VARCHAR(100) NOT NULL UNIQUE,
  config_value TEXT NOT NULL,
  description VARCHAR(255) DEFAULT NULL,
  is_encrypted TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_sc_key (config_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 24. MOVIE VIEWS DAILY (Analytics aggregation)
-- =============================================================================
CREATE TABLE IF NOT EXISTS movie_views_daily (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  movie_id INT UNSIGNED NOT NULL,
  view_date DATE NOT NULL,
  view_count INT UNSIGNED NOT NULL DEFAULT 0,
  stream_count INT UNSIGNED NOT NULL DEFAULT 0,
  download_count INT UNSIGNED NOT NULL DEFAULT 0,
  purchase_count INT UNSIGNED NOT NULL DEFAULT 0,
  unique_viewers INT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_mvd_movie_date (movie_id, view_date),
  INDEX idx_mvd_date (view_date),
  CONSTRAINT fk_mvd_movie FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 25. PLATFORM STATISTICS (pre-aggregated for dashboards)
-- =============================================================================
CREATE TABLE IF NOT EXISTS platform_statistics (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  stat_date DATE NOT NULL UNIQUE,
  total_users INT UNSIGNED NOT NULL DEFAULT 0,
  new_users INT UNSIGNED NOT NULL DEFAULT 0,
  total_movies INT UNSIGNED NOT NULL DEFAULT 0,
  total_orders INT UNSIGNED NOT NULL DEFAULT 0,
  total_revenue DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  developer_commission DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  owner_earnings DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  total_streams INT UNSIGNED NOT NULL DEFAULT 0,
  total_downloads INT UNSIGNED NOT NULL DEFAULT 0,
  active_users INT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_ps_date (stat_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
