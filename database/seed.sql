-- =============================================================================
-- DJ Star Original Movies - Seed Data
-- =============================================================================

USE dj_star_movies;

-- =============================================================================
-- 1. Seed Roles
-- =============================================================================
INSERT INTO roles (name, slug, description, is_system) VALUES
  ('User', 'user', 'Regular customer who can browse and purchase movies', 1),
  ('Movie Owner', 'movie_owner', 'Administrator responsible for movie catalog and business operations', 1),
  ('Developer', 'developer', 'Platform developer with full system access', 1)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- =============================================================================
-- 2. Seed System Configuration
-- =============================================================================
INSERT INTO system_configurations (config_key, config_value, description) VALUES
  ('platform_name', 'DJ Star Original Movies', 'Platform display name'),
  ('developer_commission_percentage', '40', 'Percentage commission for platform developer'),
  ('currency', 'KES', 'Default currency'),
  ('max_login_attempts', '5', 'Maximum failed login attempts before lockout'),
  ('login_lockout_minutes', '30', 'Lockout duration in minutes'),
  ('verification_code_expiry_minutes', '15', 'Verification code expiry in minutes'),
  ('max_verification_attempts', '5', 'Maximum verification code attempts'),
  ('streaming_enabled', 'true', 'Enable movie streaming'),
  ('download_enabled', 'true', 'Enable movie downloads'),
  ('registration_enabled', 'true', 'Allow new user registration')
ON DUPLICATE KEY UPDATE config_value = VALUES(config_value);

-- =============================================================================
-- 3. Seed Default Categories
-- =============================================================================
INSERT INTO categories (name, slug, description, display_order, is_visible) VALUES
  ('Movies', 'movies', 'Full-length feature films', 1, 1),
  ('Series', 'series', 'TV series and episodic content', 2, 1),
  ('Action', 'action', 'Action-packed movies and series', 3, 1),
  ('Comedy', 'comedy', 'Comedy and humorous content', 4, 1),
  ('Drama', 'drama', 'Dramatic storytelling', 5, 1),
  ('Romance', 'romance', 'Love stories and romantic content', 6, 1),
  ('Documentary', 'documentary', 'Documentary films and educational content', 7, 1),
  ('Animation', 'animation', 'Animated movies and series', 8, 1),
  ('Thriller', 'thriller', 'Suspenseful and thriller content', 9, 1),
  ('Horror', 'horror', 'Horror and scary content', 10, 1)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- =============================================================================
-- 4. Create default developer account (if not exists)
-- Note: Password should be changed after first login
-- Default password: Admin@123456 (bcrypt hash)
-- =============================================================================
-- Developer account will be created by the application on first run
-- or manually via registration endpoint
