CREATE TABLE `reviews` (
  `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INTEGER UNSIGNED NOT NULL,
  `movie_id` INTEGER UNSIGNED NOT NULL,
  `rating` INTEGER UNSIGNED NOT NULL,
  `comment` TEXT,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,

  UNIQUE INDEX `uq_review_user_movie`(`user_id`, `movie_id`),
  INDEX `idx_review_movie`(`movie_id`),
  INDEX `idx_review_user`(`user_id`),
  INDEX `idx_review_rating`(`rating`),

  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `reviews` ADD FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `reviews` ADD FOREIGN KEY (`movie_id`) REFERENCES `movies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
