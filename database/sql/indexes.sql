-- ============================================================================
-- DJ Star Original Movies - Database Indexes
-- ============================================================================
-- Run after initial schema creation to ensure optimal query performance
-- ============================================================================

-- Users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_created ON users(created_at);

-- Movies
CREATE INDEX IF NOT EXISTS idx_movies_slug ON movies(slug);
CREATE INDEX IF NOT EXISTS idx_movies_status ON movies(status);
CREATE INDEX IF NOT EXISTS idx_movies_category ON movies(category_id);
CREATE INDEX IF NOT EXISTS idx_movies_featured ON movies(is_featured);
CREATE INDEX IF NOT EXISTS idx_movies_popularity ON movies(popularity_score);
CREATE INDEX IF NOT EXISTS idx_movies_created ON movies(created_at);
CREATE INDEX IF NOT EXISTS idx_movies_published ON movies(published_at);
CREATE INDEX IF NOT EXISTS idx_movies_price ON movies(price);
CREATE FULLTEXT INDEX ft_movies_search ON movies(title, description, short_description);

-- Orders
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);

-- Transactions
CREATE INDEX IF NOT EXISTS idx_txn_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_txn_order ON transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_txn_reference ON transactions(transaction_reference);
CREATE INDEX IF NOT EXISTS idx_txn_merchant ON transactions(merchant_request_id);
CREATE INDEX IF NOT EXISTS idx_txn_checkout ON transactions(checkout_request_id);
CREATE INDEX IF NOT EXISTS idx_txn_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_txn_created ON transactions(created_at);

-- User Library
CREATE UNIQUE INDEX IF NOT EXISTS uq_library_user_movie ON user_library(user_id, movie_id);
CREATE INDEX IF NOT EXISTS idx_ul_user ON user_library(user_id);
CREATE INDEX IF NOT EXISTS idx_ul_movie ON user_library(movie_id);

-- Playback Progress
CREATE UNIQUE INDEX IF NOT EXISTS uq_pp_user_movie ON playback_progress(user_id, movie_id);
CREATE INDEX IF NOT EXISTS idx_pp_user ON playback_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_pp_movie ON playback_progress(movie_id);
CREATE INDEX IF NOT EXISTS idx_pp_last_watched ON playback_progress(last_watched_at);

-- Stream & Download Logs
CREATE INDEX IF NOT EXISTS idx_sl_user ON stream_log(user_id);
CREATE INDEX IF NOT EXISTS idx_sl_movie ON stream_log(movie_id);
CREATE INDEX IF NOT EXISTS idx_sl_started ON stream_log(started_at);
CREATE INDEX IF NOT EXISTS idx_dl_user ON download_log(user_id);
CREATE INDEX IF NOT EXISTS idx_dl_movie ON download_log(movie_id);
CREATE INDEX IF NOT EXISTS idx_dl_created ON download_log(created_at);

-- Categories
CREATE INDEX IF NOT EXISTS idx_cat_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_cat_parent ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_cat_visible ON categories(is_visible);
CREATE INDEX IF NOT EXISTS idx_cat_order ON categories(display_order);

-- Support Tickets
CREATE INDEX IF NOT EXISTS idx_st_user ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_st_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_st_priority ON support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_st_assigned ON support_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_st_created ON support_tickets(created_at);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notif_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notif_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notif_created ON notifications(created_at);

-- Daily Analytics
CREATE UNIQUE INDEX IF NOT EXISTS uq_mvd_movie_date ON movie_views_daily(movie_id, view_date);
CREATE INDEX IF NOT EXISTS idx_mvd_date ON movie_views_daily(view_date);

-- Platform Statistics
CREATE INDEX IF NOT EXISTS idx_ps_date ON platform_statistics(stat_date);

-- Audit & Activity Logs
CREATE INDEX IF NOT EXISTS idx_al_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_al_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_al_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_al_created ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_ual_user ON user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_ual_action ON user_activity_log(action);
CREATE INDEX IF NOT EXISTS idx_ual_entity ON user_activity_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_ual_created ON user_activity_log(created_at);

-- Verification Codes
CREATE INDEX IF NOT EXISTS idx_vc_user ON verification_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_vc_code ON verification_codes(code);
CREATE INDEX IF NOT EXISTS idx_vc_type ON verification_codes(type);
CREATE INDEX IF NOT EXISTS idx_vc_expires ON verification_codes(expires_at);

-- User Sessions
CREATE INDEX IF NOT EXISTS idx_us_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_us_token ON user_sessions(token);
CREATE INDEX IF NOT EXISTS idx_us_active ON user_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_us_expires ON user_sessions(expires_at);

-- Movie Files
CREATE INDEX IF NOT EXISTS idx_mf_movie ON movie_files(movie_id);

-- Movie Tags
CREATE INDEX IF NOT EXISTS idx_mt_slug ON movie_tags(slug);
CREATE INDEX IF NOT EXISTS idx_mtp_tag ON movie_tag_pivot(tag_id);

-- Revenue Records
CREATE INDEX IF NOT EXISTS idx_rv_order ON revenue_records(order_id);
CREATE INDEX IF NOT EXISTS idx_rv_recorded ON revenue_records(recorded_at);
CREATE INDEX IF NOT EXISTS idx_rv_transaction ON revenue_records(transaction_id);

-- Receipts
CREATE INDEX IF NOT EXISTS idx_rec_order ON receipts(order_id);
CREATE INDEX IF NOT EXISTS idx_rec_user ON receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_rec_number ON receipts(receipt_number);
