-- CreateTable
CREATE TABLE `roles` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    `slug` ENUM('user', 'movie_owner', 'developer') NOT NULL,
    `description` VARCHAR(255) NULL,
    `is_system` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `roles_name_key`(`name`),
    UNIQUE INDEX `roles_slug_key`(`slug`),
    INDEX `idx_roles_slug`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `role_id` INTEGER UNSIGNED NOT NULL,
    `username` VARCHAR(50) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(20) NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `first_name` VARCHAR(100) NULL,
    `last_name` VARCHAR(100) NULL,
    `avatar_url` VARCHAR(500) NULL,
    `status` ENUM('active', 'unverified', 'suspended', 'disabled', 'deleted') NOT NULL DEFAULT 'unverified',
    `email_verified_at` DATETIME(3) NULL,
    `phone_verified_at` DATETIME(3) NULL,
    `last_login_at` DATETIME(3) NULL,
    `last_login_ip` VARCHAR(45) NULL,
    `login_attempts` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `locked_until` DATETIME(3) NULL,
    `password_changed_at` DATETIME(3) NULL,
    `two_factor_enabled` BOOLEAN NOT NULL DEFAULT false,
    `two_factor_secret` VARCHAR(255) NULL,
    `metadata` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `users_username_key`(`username`),
    UNIQUE INDEX `users_email_key`(`email`),
    UNIQUE INDEX `users_phone_key`(`phone`),
    INDEX `idx_users_email`(`email`),
    INDEX `idx_users_username`(`username`),
    INDEX `idx_users_status`(`status`),
    INDEX `idx_users_role`(`role_id`),
    INDEX `idx_users_created`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `verification_codes` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER UNSIGNED NOT NULL,
    `code` VARCHAR(6) NOT NULL,
    `type` ENUM('email_verification', 'password_reset', 'email_change', 'phone_verification') NOT NULL,
    `purpose` VARCHAR(100) NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `used_at` DATETIME(3) NULL,
    `attempts` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `max_attempts` INTEGER UNSIGNED NOT NULL DEFAULT 5,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_vc_user`(`user_id`),
    INDEX `idx_vc_code`(`code`),
    INDEX `idx_vc_type`(`type`),
    INDEX `idx_vc_expires`(`expires_at`),
    INDEX `idx_vc_used`(`used_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_sessions` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER UNSIGNED NOT NULL,
    `token` VARCHAR(500) NOT NULL,
    `refresh_token` VARCHAR(500) NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` VARCHAR(500) NULL,
    `device_type` VARCHAR(50) NULL,
    `device_name` VARCHAR(255) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `last_activity_at` DATETIME(3) NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `revoked_at` DATETIME(3) NULL,

    INDEX `idx_us_user`(`user_id`),
    INDEX `idx_us_token`(`token`),
    INDEX `idx_us_active`(`is_active`),
    INDEX `idx_us_expires`(`expires_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_activity_log` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER UNSIGNED NULL,
    `action` VARCHAR(100) NOT NULL,
    `entity_type` VARCHAR(100) NULL,
    `entity_id` INTEGER UNSIGNED NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` VARCHAR(500) NULL,
    `details` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_ual_user`(`user_id`),
    INDEX `idx_ual_action`(`action`),
    INDEX `idx_ual_entity`(`entity_type`, `entity_id`),
    INDEX `idx_ual_created`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `categories` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `parent_id` INTEGER UNSIGNED NULL,
    `icon` VARCHAR(255) NULL,
    `display_order` INTEGER NOT NULL DEFAULT 0,
    `is_visible` BOOLEAN NOT NULL DEFAULT true,
    `is_series` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `categories_name_key`(`name`),
    UNIQUE INDEX `categories_slug_key`(`slug`),
    INDEX `idx_cat_slug`(`slug`),
    INDEX `idx_cat_parent`(`parent_id`),
    INDEX `idx_cat_visible`(`is_visible`),
    INDEX `idx_cat_order`(`display_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `movies` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `category_id` INTEGER UNSIGNED NULL,
    `title` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `short_description` VARCHAR(500) NULL,
    `duration` INTEGER UNSIGNED NULL,
    `release_year` INTEGER NULL,
    `language` VARCHAR(50) NULL DEFAULT 'English',
    `quality` VARCHAR(20) NULL DEFAULT 'HD',
    `age_rating` VARCHAR(10) NULL,
    `director` VARCHAR(255) NULL,
    `cast_members` JSON NULL,
    `poster_url` VARCHAR(500) NULL,
    `cover_url` VARCHAR(500) NULL,
    `trailer_url` VARCHAR(500) NULL,
    `thumbnail_url` VARCHAR(500) NULL,
    `movie_url` VARCHAR(500) NULL,
    `movie_size` BIGINT UNSIGNED NULL,
    `movie_format` VARCHAR(20) NULL,
    `price` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `is_free` BOOLEAN NOT NULL DEFAULT false,
    `is_featured` BOOLEAN NOT NULL DEFAULT false,
    `status` ENUM('draft', 'published', 'hidden', 'archived', 'unavailable') NOT NULL DEFAULT 'draft',
    `is_series` BOOLEAN NOT NULL DEFAULT false,
    `series_id` INTEGER UNSIGNED NULL,
    `episode_number` INTEGER UNSIGNED NULL,
    `season_number` INTEGER UNSIGNED NULL,
    `total_views` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `total_purchases` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `total_streams` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `total_downloads` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `completion_rate` DECIMAL(5, 2) NULL DEFAULT 0.00,
    `popularity_score` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `metadata` JSON NULL,
    `published_at` DATETIME(3) NULL,
    `created_by` INTEGER UNSIGNED NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `movies_slug_key`(`slug`),
    INDEX `idx_movies_slug`(`slug`),
    INDEX `idx_movies_status`(`status`),
    INDEX `idx_movies_category`(`category_id`),
    INDEX `idx_movies_series`(`series_id`),
    INDEX `idx_movies_featured`(`is_featured`),
    INDEX `idx_movies_popularity`(`popularity_score`),
    INDEX `idx_movies_created`(`created_at`),
    INDEX `idx_movies_published`(`published_at`),
    INDEX `idx_movies_price`(`price`),
    INDEX `idx_movies_search`(`title`),
    FULLTEXT INDEX `ft_movies_search`(`title`, `description`, `short_description`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `movie_files` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `movie_id` INTEGER UNSIGNED NOT NULL,
    `quality` VARCHAR(20) NOT NULL,
    `format` VARCHAR(20) NOT NULL,
    `file_url` VARCHAR(500) NOT NULL,
    `file_size` BIGINT UNSIGNED NOT NULL,
    `duration` INTEGER UNSIGNED NULL,
    `language` VARCHAR(50) NULL DEFAULT 'English',
    `is_default` BOOLEAN NOT NULL DEFAULT false,
    `metadata` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_mf_movie`(`movie_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `movie_tags` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(100) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `movie_tags_name_key`(`name`),
    UNIQUE INDEX `movie_tags_slug_key`(`slug`),
    INDEX `idx_mt_slug`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `movie_tag_pivot` (
    `movie_id` INTEGER UNSIGNED NOT NULL,
    `tag_id` INTEGER UNSIGNED NOT NULL,

    INDEX `idx_mtp_tag`(`tag_id`),
    PRIMARY KEY (`movie_id`, `tag_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_library` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER UNSIGNED NOT NULL,
    `movie_id` INTEGER UNSIGNED NOT NULL,
    `order_id` INTEGER UNSIGNED NULL,
    `purchase_price` DECIMAL(10, 2) NOT NULL,
    `is_available` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_ul_user`(`user_id`),
    INDEX `idx_ul_movie`(`movie_id`),
    UNIQUE INDEX `user_library_user_id_movie_id_key`(`user_id`, `movie_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `playback_progress` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER UNSIGNED NOT NULL,
    `movie_id` INTEGER UNSIGNED NOT NULL,
    `position_seconds` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `duration_seconds` INTEGER UNSIGNED NULL,
    `completed` BOOLEAN NOT NULL DEFAULT false,
    `last_watched_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_pp_user`(`user_id`),
    INDEX `idx_pp_movie`(`movie_id`),
    INDEX `idx_pp_last_watched`(`last_watched_at`),
    UNIQUE INDEX `playback_progress_user_id_movie_id_key`(`user_id`, `movie_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `download_log` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER UNSIGNED NOT NULL,
    `movie_id` INTEGER UNSIGNED NOT NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` VARCHAR(500) NULL,
    `download_size` BIGINT UNSIGNED NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_dl_user`(`user_id`),
    INDEX `idx_dl_movie`(`movie_id`),
    INDEX `idx_dl_created`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stream_log` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER UNSIGNED NOT NULL,
    `movie_id` INTEGER UNSIGNED NOT NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` VARCHAR(500) NULL,
    `bytes_streamed` BIGINT UNSIGNED NULL DEFAULT 0,
    `started_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ended_at` DATETIME(3) NULL,

    INDEX `idx_sl_user`(`user_id`),
    INDEX `idx_sl_movie`(`movie_id`),
    INDEX `idx_sl_started`(`started_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `transactions` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER UNSIGNED NOT NULL,
    `order_id` INTEGER UNSIGNED NULL,
    `transaction_reference` VARCHAR(100) NULL,
    `merchant_request_id` VARCHAR(100) NULL,
    `checkout_request_id` VARCHAR(100) NULL,
    `phone_number` VARCHAR(20) NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `currency` VARCHAR(10) NOT NULL DEFAULT 'KES',
    `status` ENUM('pending', 'processing', 'successful', 'failed', 'cancelled', 'expired', 'reversed') NOT NULL DEFAULT 'pending',
    `payment_method` VARCHAR(50) NULL DEFAULT 'mpesa_buy_goods',
    `payment_provider` VARCHAR(50) NULL DEFAULT 'safaricom',
    `result_code` VARCHAR(20) NULL,
    `result_description` TEXT NULL,
    `mpesa_receipt` VARCHAR(100) NULL,
    `transaction_date` DATETIME(3) NULL,
    `callback_received_at` DATETIME(3) NULL,
    `callback_data` JSON NULL,
    `metadata` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `transactions_transaction_reference_key`(`transaction_reference`),
    INDEX `idx_txn_user`(`user_id`),
    INDEX `idx_txn_order`(`order_id`),
    INDEX `idx_txn_reference`(`transaction_reference`),
    INDEX `idx_txn_merchant`(`merchant_request_id`),
    INDEX `idx_txn_checkout`(`checkout_request_id`),
    INDEX `idx_txn_status`(`status`),
    INDEX `idx_txn_created`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `orders` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER UNSIGNED NOT NULL,
    `order_number` VARCHAR(50) NOT NULL,
    `total_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `currency` VARCHAR(10) NOT NULL DEFAULT 'KES',
    `status` ENUM('pending', 'processing', 'completed', 'failed', 'refunded', 'partially_refunded') NOT NULL DEFAULT 'pending',
    `payment_status` ENUM('pending', 'paid', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
    `paid_at` DATETIME(3) NULL,
    `notes` TEXT NULL,
    `metadata` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `orders_order_number_key`(`order_number`),
    INDEX `idx_orders_user`(`user_id`),
    INDEX `idx_orders_number`(`order_number`),
    INDEX `idx_orders_status`(`status`),
    INDEX `idx_orders_created`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_items` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `order_id` INTEGER UNSIGNED NOT NULL,
    `movie_id` INTEGER UNSIGNED NOT NULL,
    `item_price` DECIMAL(10, 2) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_oi_order`(`order_id`),
    INDEX `idx_oi_movie`(`movie_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `receipts` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `order_id` INTEGER UNSIGNED NOT NULL,
    `user_id` INTEGER UNSIGNED NOT NULL,
    `receipt_number` VARCHAR(50) NOT NULL,
    `receipt_data` JSON NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `receipts_receipt_number_key`(`receipt_number`),
    INDEX `idx_rec_order`(`order_id`),
    INDEX `idx_rec_user`(`user_id`),
    INDEX `idx_rec_number`(`receipt_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `revenue_records` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `order_id` INTEGER UNSIGNED NOT NULL,
    `transaction_id` INTEGER UNSIGNED NULL,
    `total_amount` DECIMAL(10, 2) NOT NULL,
    `developer_commission` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `owner_earnings` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `commission_percentage` DECIMAL(5, 2) NOT NULL DEFAULT 40.00,
    `currency` VARCHAR(10) NOT NULL DEFAULT 'KES',
    `recorded_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_rv_order`(`order_id`),
    INDEX `idx_rv_recorded`(`recorded_at`),
    INDEX `idx_rv_transaction`(`transaction_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER UNSIGNED NULL,
    `action` VARCHAR(100) NOT NULL,
    `entity_type` VARCHAR(100) NULL,
    `entity_id` INTEGER UNSIGNED NULL,
    `old_values` JSON NULL,
    `new_values` JSON NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` VARCHAR(500) NULL,
    `details` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_al_user`(`user_id`),
    INDEX `idx_al_action`(`action`),
    INDEX `idx_al_entity`(`entity_type`, `entity_id`),
    INDEX `idx_al_created`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `support_tickets` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER UNSIGNED NOT NULL,
    `ticket_number` VARCHAR(20) NOT NULL,
    `subject` VARCHAR(255) NOT NULL,
    `message` TEXT NOT NULL,
    `priority` ENUM('low', 'medium', 'high', 'urgent') NOT NULL DEFAULT 'medium',
    `status` ENUM('open', 'in_progress', 'waiting_on_customer', 'resolved', 'closed') NOT NULL DEFAULT 'open',
    `assigned_to` INTEGER UNSIGNED NULL,
    `resolved_at` DATETIME(3) NULL,
    `closed_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `support_tickets_ticket_number_key`(`ticket_number`),
    INDEX `idx_st_user`(`user_id`),
    INDEX `idx_st_status`(`status`),
    INDEX `idx_st_priority`(`priority`),
    INDEX `idx_st_assigned`(`assigned_to`),
    INDEX `idx_st_created`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `support_ticket_replies` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `ticket_id` INTEGER UNSIGNED NOT NULL,
    `user_id` INTEGER UNSIGNED NOT NULL,
    `message` TEXT NOT NULL,
    `is_staff` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_str_ticket`(`ticket_id`),
    INDEX `idx_str_user`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER UNSIGNED NULL,
    `type` VARCHAR(50) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `message` TEXT NOT NULL,
    `data` JSON NULL,
    `is_read` BOOLEAN NOT NULL DEFAULT false,
    `read_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_notif_user`(`user_id`),
    INDEX `idx_notif_type`(`type`),
    INDEX `idx_notif_read`(`is_read`),
    INDEX `idx_notif_created`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `system_configurations` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `config_key` VARCHAR(100) NOT NULL,
    `config_value` TEXT NOT NULL,
    `description` VARCHAR(255) NULL,
    `is_encrypted` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `system_configurations_config_key_key`(`config_key`),
    INDEX `idx_sc_key`(`config_key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `movie_views_daily` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `movie_id` INTEGER UNSIGNED NOT NULL,
    `view_date` DATE NOT NULL,
    `view_count` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `stream_count` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `download_count` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `purchase_count` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `unique_viewers` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `idx_mvd_date`(`view_date`),
    UNIQUE INDEX `movie_views_daily_movie_id_view_date_key`(`movie_id`, `view_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `platform_statistics` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `stat_date` DATE NOT NULL,
    `total_users` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `new_users` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `total_movies` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `total_orders` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `total_revenue` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `developer_commission` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `owner_earnings` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `total_streams` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `total_downloads` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `active_users` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `platform_statistics_stat_date_key`(`stat_date`),
    INDEX `idx_ps_date`(`stat_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `verification_codes` ADD CONSTRAINT `verification_codes_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_sessions` ADD CONSTRAINT `user_sessions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_activity_log` ADD CONSTRAINT `user_activity_log_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `categories` ADD CONSTRAINT `categories_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `movies` ADD CONSTRAINT `movies_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `movies` ADD CONSTRAINT `movies_series_id_fkey` FOREIGN KEY (`series_id`) REFERENCES `movies`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `movies` ADD CONSTRAINT `movies_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `movie_files` ADD CONSTRAINT `movie_files_movie_id_fkey` FOREIGN KEY (`movie_id`) REFERENCES `movies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `movie_tag_pivot` ADD CONSTRAINT `movie_tag_pivot_movie_id_fkey` FOREIGN KEY (`movie_id`) REFERENCES `movies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `movie_tag_pivot` ADD CONSTRAINT `movie_tag_pivot_tag_id_fkey` FOREIGN KEY (`tag_id`) REFERENCES `movie_tags`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_library` ADD CONSTRAINT `user_library_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_library` ADD CONSTRAINT `user_library_movie_id_fkey` FOREIGN KEY (`movie_id`) REFERENCES `movies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `playback_progress` ADD CONSTRAINT `playback_progress_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `playback_progress` ADD CONSTRAINT `playback_progress_movie_id_fkey` FOREIGN KEY (`movie_id`) REFERENCES `movies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `download_log` ADD CONSTRAINT `download_log_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `download_log` ADD CONSTRAINT `download_log_movie_id_fkey` FOREIGN KEY (`movie_id`) REFERENCES `movies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stream_log` ADD CONSTRAINT `stream_log_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stream_log` ADD CONSTRAINT `stream_log_movie_id_fkey` FOREIGN KEY (`movie_id`) REFERENCES `movies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_movie_id_fkey` FOREIGN KEY (`movie_id`) REFERENCES `movies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `receipts` ADD CONSTRAINT `receipts_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `receipts` ADD CONSTRAINT `receipts_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `revenue_records` ADD CONSTRAINT `revenue_records_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `revenue_records` ADD CONSTRAINT `revenue_records_transaction_id_fkey` FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `support_tickets` ADD CONSTRAINT `support_tickets_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `support_tickets` ADD CONSTRAINT `support_tickets_assigned_to_fkey` FOREIGN KEY (`assigned_to`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `support_ticket_replies` ADD CONSTRAINT `support_ticket_replies_ticket_id_fkey` FOREIGN KEY (`ticket_id`) REFERENCES `support_tickets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `support_ticket_replies` ADD CONSTRAINT `support_ticket_replies_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `movie_views_daily` ADD CONSTRAINT `movie_views_daily_movie_id_fkey` FOREIGN KEY (`movie_id`) REFERENCES `movies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
