# DJ Star Original Movies - Database Documentation

## Overview
This document describes the complete MySQL database schema for the DJ Star Original Movies platform. The database is designed for production use, supporting thousands of users, thousands of movies, and comprehensive financial tracking.

## Database Engine
- **Engine**: InnoDB (all tables) - provides ACID compliance, foreign key support, and row-level locking
- **Charset**: utf8mb4 - full Unicode support including emoji
- **Collation**: utf8mb4_unicode_ci - case-insensitive Unicode sorting

---

## Table Reference

### 1. `roles`
**Purpose**: Defines user roles for Role-Based Access Control (RBAC).

| Column | Type | Description |
|--------|------|-------------|
| id | INT UNSIGNED PK | Auto-increment ID |
| name | VARCHAR(50) UNIQUE | Display name (e.g., "User", "Movie Owner", "Developer") |
| slug | VARCHAR(50) UNIQUE | URL-friendly identifier (e.g., "user", "movie_owner", "developer") |
| description | VARCHAR(255) | Optional description of the role |
| is_system | TINYINT(1) | Whether this is a system-protected role (cannot be deleted) |
| created_at | TIMESTAMP | When the role was created |
| updated_at | TIMESTAMP | When the role was last modified |

**Indexes**: `slug` for quick role lookup.

---

### 2. `users`
**Purpose**: Stores all user accounts. Supports soft deletes.

| Column | Type | Description |
|--------|------|-------------|
| id | INT UNSIGNED PK | Auto-increment ID |
| role_id | INT UNSIGNED FK | References `roles.id` |
| username | VARCHAR(50) UNIQUE | Unique username for login |
| email | VARCHAR(255) UNIQUE | Unique email address |
| phone | VARCHAR(20) UNIQUE | Kenyan phone number (254 format) |
| password_hash | VARCHAR(255) | BCrypt hashed password |
| first_name | VARCHAR(100) | User's first name |
| last_name | VARCHAR(100) | User's last name |
| avatar_url | VARCHAR(500) | Profile avatar URL |
| status | ENUM | 'active', 'unverified', 'suspended', 'disabled', 'deleted' |
| email_verified_at | TIMESTAMP | When email was verified |
| phone_verified_at | TIMESTAMP | When phone was verified |
| last_login_at | TIMESTAMP | Last successful login |
| last_login_ip | VARCHAR(45) | IP of last login (IPv4 or IPv6) |
| login_attempts | INT | Counter for failed login attempts |
| locked_until | TIMESTAMP | Account lock expiration |
| password_changed_at | TIMESTAMP | When password was last changed |
| two_factor_enabled | TINYINT(1) | Whether 2FA is enabled (future use) |
| two_factor_secret | VARCHAR(255) | 2FA secret key (future use) |
| metadata | JSON | Flexible metadata for future expansion |
| created_at | TIMESTAMP | Registration time |
| updated_at | TIMESTAMP | Last update time |
| deleted_at | TIMESTAMP | Soft delete timestamp |

**Indexes**: `email`, `username`, `status`, `role_id`, `created_at` - optimize lookups, filtering, and reporting.

---

### 3. `verification_codes`
**Purpose**: Stores email verification and password reset codes.

| Column | Type | Description |
|--------|------|-------------|
| id | INT UNSIGNED PK | Auto-increment ID |
| user_id | INT UNSIGNED FK | References `users.id`, CASCADE delete |
| code | VARCHAR(6) | 6-digit numeric code |
| type | ENUM | 'email_verification', 'password_reset', 'email_change', 'phone_verification' |
| purpose | VARCHAR(100) | Optional description of purpose |
| expires_at | TIMESTAMP | When the code expires |
| used_at | TIMESTAMP | When the code was used (NULL if unused) |
| attempts | INT | Number of verification attempts |
| max_attempts | INT | Maximum allowed attempts (default: 5) |
| created_at | TIMESTAMP | When the code was generated |

**Indexes**: `user_id`, `code`, `type`, `expires_at`, `used_at` - for efficient code validation and cleanup.

---

### 4. `user_sessions`
**Purpose**: Manages authenticated user sessions and supports future multi-device tracking.

| Column | Type | Description |
|--------|------|-------------|
| id | INT UNSIGNED PK | Auto-increment ID |
| user_id | INT UNSIGNED FK | References `users.id`, CASCADE delete |
| token | VARCHAR(500) | JWT access token |
| refresh_token | VARCHAR(500) | JWT refresh token |
| ip_address | VARCHAR(45) | IP address used for login |
| user_agent | VARCHAR(500) | Browser/device user agent |
| device_type | VARCHAR(50) | Device type (future use) |
| device_name | VARCHAR(255) | Device name (future use) |
| is_active | TINYINT(1) | Whether session is active |
| last_activity_at | TIMESTAMP | Last activity timestamp |
| expires_at | TIMESTAMP | Session expiration |
| created_at | TIMESTAMP | Session creation time |
| revoked_at | TIMESTAMP | When session was revoked |

**Indexes**: `user_id`, `token` (prefix), `is_active`, `expires_at` - for session validation and cleanup.

---

### 5. `user_activity_log`
**Purpose**: Tracks all significant user activities for auditing and security analysis.

| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT UNSIGNED PK | Auto-increment ID (BIGINT for high volume) |
| user_id | INT UNSIGNED FK | References `users.id`, SET NULL on delete |
| action | VARCHAR(100) | Action performed (e.g., 'login', 'purchase_completed') |
| entity_type | VARCHAR(100) | Type of related entity (e.g., 'order', 'movie') |
| entity_id | INT UNSIGNED | ID of related entity |
| ip_address | VARCHAR(45) | IP address |
| user_agent | VARCHAR(500) | User agent string |
| details | JSON | Flexible action-specific data |
| created_at | TIMESTAMP | When the activity occurred |

**Indexes**: `user_id`, `action`, `entity_type/entity_id`, `created_at` - for efficient querying and reporting.

---

### 6. `categories`
**Purpose**: Movie and series categories with hierarchical support.

| Column | Type | Description |
|--------|------|-------------|
| id | INT UNSIGNED PK | Auto-increment ID |
| name | VARCHAR(100) UNIQUE | Category display name |
| slug | VARCHAR(100) UNIQUE | URL-friendly identifier |
| description | TEXT | Category description |
| parent_id | INT UNSIGNED FK | Self-referencing for subcategories |
| icon | VARCHAR(255) | Icon URL |
| display_order | INT | Sort order |
| is_visible | TINYINT(1) | Whether category is publicly visible |
| is_series | TINYINT(1) | Whether this category is for series |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Last update |

**Indexes**: `slug`, `parent_id`, `is_visible`, `display_order` - for navigation and filtering.

---

### 7. `movies`
**Purpose**: Core table storing all movie/series data.

| Column | Type | Description |
|--------|------|-------------|
| id | INT UNSIGNED PK | Auto-increment ID |
| category_id | INT UNSIGNED FK | References `categories.id`, SET NULL |
| title | VARCHAR(255) | Movie title |
| slug | VARCHAR(255) UNIQUE | URL-friendly identifier |
| description | TEXT | Full description |
| short_description | VARCHAR(500) | Brief description for listings |
| duration | INT UNSIGNED | Duration in seconds |
| release_year | YEAR | Release year |
| language | VARCHAR(50) | Language (default: English) |
| quality | VARCHAR(20) | Video quality (HD, 4K, etc.) |
| age_rating | VARCHAR(10) | Age rating (PG, R, etc.) |
| director | VARCHAR(255) | Director name |
| cast_members | JSON | Array of cast member names |
| poster_url | VARCHAR(500) | Poster image URL (R2 key or public URL) |
| cover_url | VARCHAR(500) | Cover/background image URL |
| trailer_url | VARCHAR(500) | Trailer video URL |
| thumbnail_url | VARCHAR(500) | Thumbnail image URL |
| movie_url | VARCHAR(500) | Movie file key in R2 |
| movie_size | BIGINT UNSIGNED | File size in bytes |
| movie_format | VARCHAR(20) | File format (mp4, mkv, etc.) |
| price | DECIMAL(10,2) | Purchase price |
| is_free | TINYINT(1) | Whether the movie is free |
| is_featured | TINYINT(1) | Whether to feature on homepage |
| status | ENUM | 'draft', 'published', 'hidden', 'archived', 'unavailable' |
| is_series | TINYINT(1) | Whether this is a series/series episode |
| series_id | INT UNSIGNED FK | Self-referencing for series grouping |
| episode_number | INT UNSIGNED | Episode number (for series) |
| season_number | INT UNSIGNED | Season number (for series) |
| total_views | INT UNSIGNED | View counter |
| total_purchases | INT UNSIGNED | Purchase counter |
| total_streams | INT UNSIGNED | Stream counter |
| total_downloads | INT UNSIGNED | Download counter |
| completion_rate | DECIMAL(5,2) | Average completion rate |
| popularity_score | DECIMAL(10,2) | Calculated popularity metric |
| metadata | JSON | Flexible metadata for future expansion |
| published_at | TIMESTAMP | When published |
| created_by | INT UNSIGNED FK | References `users.id` (admin who added it) |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Last update |
| deleted_at | TIMESTAMP | Soft delete timestamp |

**Indexes**: `slug`, `status`, `category_id`, `series_id`, `is_featured`, `popularity_score` DESC, `created_at` DESC, `published_at` DESC, `price`, `title` - comprehensive indexing for all query patterns. **FULLTEXT** index on `title`, `description`, `short_description` for fast search.

---

### 8. `movie_tags`
**Purpose**: Tags for flexible movie categorization.

| Column | Type | Description |
|--------|------|-------------|
| id | INT UNSIGNED PK | Auto-increment ID |
| name | VARCHAR(100) UNIQUE | Tag name |
| slug | VARCHAR(100) UNIQUE | URL-friendly slug |

---

### 9. `movie_tag_pivot`
**Purpose**: Many-to-many relationship between movies and tags.

| Column | Type | Description |
|--------|------|-------------|
| movie_id | INT UNSIGNED FK | References `movies.id`, CASCADE delete |
| tag_id | INT UNSIGNED FK | References `movie_tags.id`, CASCADE delete |

**Composite Primary Key**: (movie_id, tag_id)

---

### 10. `user_library`
**Purpose**: Records movie ownership after purchase.

| Column | Type | Description |
|--------|------|-------------|
| id | INT UNSIGNED PK | Auto-increment ID |
| user_id | INT UNSIGNED FK | References `users.id`, CASCADE delete |
| movie_id | INT UNSIGNED FK | References `movies.id`, CASCADE delete |
| order_id | INT UNSIGNED | Related order |
| purchase_price | DECIMAL(10,2) | Price paid at time of purchase |
| is_available | TINYINT(1) | Whether the movie is still accessible |
| created_at | TIMESTAMP | Purchase time |

**Unique Key**: (user_id, movie_id) - prevents duplicate purchases.

---

### 11. `playback_progress`
**Purpose**: "Continue Watching" feature - tracks where users left off.

| Column | Type | Description |
|--------|------|-------------|
| id | INT UNSIGNED PK | Auto-increment ID |
| user_id | INT UNSIGNED FK | References `users.id`, CASCADE delete |
| movie_id | INT UNSIGNED FK | References `movies.id`, CASCADE delete |
| position_seconds | INT UNSIGNED | Current playback position |
| duration_seconds | INT UNSIGNED | Total duration |
| completed | TINYINT(1) | Whether the movie was completed |
| last_watched_at | TIMESTAMP | Last playback time |
| created_at | TIMESTAMP | First playback time |

**Unique Key**: (user_id, movie_id)

---

### 12. `download_log`
**Purpose**: Tracks all movie downloads.

| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT UNSIGNED PK | Auto-increment ID |
| user_id | INT UNSIGNED FK | References `users.id`, CASCADE delete |
| movie_id | INT UNSIGNED FK | References `movies.id`, CASCADE delete |
| ip_address | VARCHAR(45) | Downloader's IP |
| user_agent | VARCHAR(500) | User agent |
| download_size | BIGINT UNSIGNED | Bytes downloaded |
| created_at | TIMESTAMP | Download time |

---

### 13. `stream_log`
**Purpose**: Tracks all streaming sessions.

| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT UNSIGNED PK | Auto-increment ID |
| user_id | INT UNSIGNED FK | References `users.id`, CASCADE delete |
| movie_id | INT UNSIGNED FK | References `movies.id`, CASCADE delete |
| ip_address | VARCHAR(45) | Streamer's IP |
| user_agent | VARCHAR(500) | User agent |
| bytes_streamed | BIGINT UNSIGNED | Bytes transferred |
| started_at | TIMESTAMP | Stream start time |
| ended_at | TIMESTAMP | Stream end time |

---

### 14. `transactions`
**Purpose**: Complete payment transaction records.

| Column | Type | Description |
|--------|------|-------------|
| id | INT UNSIGNED PK | Auto-increment ID |
| user_id | INT UNSIGNED FK | References `users.id`, CASCADE delete |
| order_id | INT UNSIGNED | Related order |
| transaction_reference | VARCHAR(100) UNIQUE | Unique transaction reference |
| merchant_request_id | VARCHAR(100) | M-Pesa merchant request ID |
| checkout_request_id | VARCHAR(100) | M-Pesa checkout request ID |
| phone_number | VARCHAR(20) | Payer's phone number |
| amount | DECIMAL(10,2) | Transaction amount |
| currency | VARCHAR(10) | Currency (KES) |
| status | ENUM | 'pending', 'processing', 'successful', 'failed', 'cancelled', 'expired', 'reversed' |
| payment_method | VARCHAR(50) | 'mpesa_buy_goods' |
| payment_provider | VARCHAR(50) | 'safaricom' |
| result_code | VARCHAR(20) | M-Pesa result code |
| result_description | TEXT | M-Pesa result description |
| mpesa_receipt | VARCHAR(100) | M-Pesa receipt number |
| transaction_date | TIMESTAMP | M-Pesa transaction date |
| callback_received_at | TIMESTAMP | When callback arrived |
| callback_data | JSON | Full callback payload |
| metadata | JSON | Flexible metadata |
| created_at | TIMESTAMP | Transaction creation |
| updated_at | TIMESTAMP | Last update |

**Indexes**: `user_id`, `order_id`, `transaction_reference`, `merchant_request_id`, `checkout_request_id`, `status`, `created_at` - comprehensive indexing for payment operations.

---

### 15. `orders`
**Purpose**: Purchase order records.

| Column | Type | Description |
|--------|------|-------------|
| id | INT UNSIGNED PK | Auto-increment ID |
| user_id | INT UNSIGNED FK | References `users.id`, CASCADE delete |
| order_number | VARCHAR(50) UNIQUE | Human-readable order number |
| total_amount | DECIMAL(10,2) | Order total |
| currency | VARCHAR(10) | Currency (KES) |
| status | ENUM | 'pending', 'processing', 'completed', 'failed', 'refunded', 'partially_refunded' |
| payment_status | ENUM | 'pending', 'paid', 'failed', 'refunded' |
| paid_at | TIMESTAMP | When payment was confirmed |
| notes | TEXT | Order notes |
| metadata | JSON | Flexible metadata |
| created_at | TIMESTAMP | Order creation |
| updated_at | TIMESTAMP | Last update |

---

### 16. `order_items`
**Purpose**: Individual items within an order.

| Column | Type | Description |
|--------|------|-------------|
| id | INT UNSIGNED PK | Auto-increment ID |
| order_id | INT UNSIGNED FK | References `orders.id`, CASCADE delete |
| movie_id | INT UNSIGNED FK | References `movies.id`, CASCADE delete |
| item_price | DECIMAL(10,2) | Price at purchase time |
| created_at | TIMESTAMP | Creation time |

---

### 17. `receipts`
**Purpose**: Digital receipts for purchases.

| Column | Type | Description |
|--------|------|-------------|
| id | INT UNSIGNED PK | Auto-increment ID |
| order_id | INT UNSIGNED FK | References `orders.id`, CASCADE delete |
| user_id | INT UNSIGNED FK | References `users.id`, CASCADE delete |
| receipt_number | VARCHAR(50) UNIQUE | Human-readable receipt number |
| receipt_data | JSON | Complete receipt data |
| created_at | TIMESTAMP | Receipt generation time |

---

### 18. `revenue_records`
**Purpose**: Tracks revenue split between developer and movie owner.

| Column | Type | Description |
|--------|------|-------------|
| id | INT UNSIGNED PK | Auto-increment ID |
| order_id | INT UNSIGNED FK | References `orders.id`, CASCADE delete |
| transaction_id | INT UNSIGNED FK | References `transactions.id`, SET NULL |
| total_amount | DECIMAL(10,2) | Gross transaction amount |
| developer_commission | DECIMAL(10,2) | Developer's 40% commission |
| owner_earnings | DECIMAL(10,2) | Movie owner's earnings |
| commission_percentage | DECIMAL(5,2) | Commission rate applied |
| currency | VARCHAR(10) | Currency (KES) |
| recorded_at | TIMESTAMP | When revenue was recorded |

---

### 19. `audit_logs`
**Purpose**: Immutable audit trail for administrative actions.

| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT UNSIGNED PK | Auto-increment ID |
| user_id | INT UNSIGNED FK | References `users.id`, SET NULL |
| action | VARCHAR(100) | Action performed |
| entity_type | VARCHAR(100) | Type of affected entity |
| entity_id | INT UNSIGNED | ID of affected entity |
| old_values | JSON | Previous state |
| new_values | JSON | New state |
| ip_address | VARCHAR(45) | Actor's IP |
| user_agent | VARCHAR(500) | Actor's user agent |
| details | TEXT | Additional details |
| created_at | TIMESTAMP | When action occurred |

---

### 20. `support_tickets`
**Purpose**: Customer support ticketing system.

| Column | Type | Description |
|--------|------|-------------|
| id | INT UNSIGNED PK | Auto-increment ID |
| user_id | INT UNSIGNED FK | References `users.id`, CASCADE delete |
| ticket_number | VARCHAR(20) UNIQUE | Human-readable ticket number |
| subject | VARCHAR(255) | Ticket subject |
| message | TEXT | Initial message |
| priority | ENUM | 'low', 'medium', 'high', 'urgent' |
| status | ENUM | 'open', 'in_progress', 'waiting_on_customer', 'resolved', 'closed' |
| assigned_to | INT UNSIGNED FK | References `users.id` (staff) |
| resolved_at | TIMESTAMP | Resolution time |
| closed_at | TIMESTAMP | Closure time |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Last update |

---

### 21. `support_ticket_replies`
**Purpose**: Replies within support tickets.

| Column | Type | Description |
|--------|------|-------------|
| id | INT UNSIGNED PK | Auto-increment ID |
| ticket_id | INT UNSIGNED FK | References `support_tickets.id`, CASCADE delete |
| user_id | INT UNSIGNED FK | References `users.id`, CASCADE delete |
| message | TEXT | Reply content |
| is_staff | TINYINT(1) | Whether reply is from staff |
| created_at | TIMESTAMP | Reply time |

---

### 22. `notifications`
**Purpose**: In-app notification system.

| Column | Type | Description |
|--------|------|-------------|
| id | INT UNSIGNED PK | Auto-increment ID |
| user_id | INT UNSIGNED FK | References `users.id`, CASCADE delete (NULL = system-wide) |
| type | VARCHAR(50) | Notification type (e.g., 'purchase_success', 'payment_failed') |
| title | VARCHAR(255) | Notification title |
| message | TEXT | Notification message |
| data | JSON | Additional data |
| is_read | TINYINT(1) | Whether notification was read |
| read_at | TIMESTAMP | When it was read |
| created_at | TIMESTAMP | Notification creation |

---

### 23. `system_configurations`
**Purpose**: Key-value store for dynamic system configuration.

| Column | Type | Description |
|--------|------|-------------|
| id | INT UNSIGNED PK | Auto-increment ID |
| config_key | VARCHAR(100) UNIQUE | Configuration key |
| config_value | TEXT | Configuration value |
| description | VARCHAR(255) | Human-readable description |
| is_encrypted | TINYINT(1) | Whether value is encrypted |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Last update |

---

### 24. `movie_views_daily`
**Purpose**: Pre-aggregated daily analytics for movies.

| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT UNSIGNED PK | Auto-increment ID |
| movie_id | INT UNSIGNED FK | References `movies.id`, CASCADE delete |
| view_date | DATE | Date of aggregation |
| view_count | INT UNSIGNED | Total views for that day |
| stream_count | INT UNSIGNED | Total streams for that day |
| download_count | INT UNSIGNED | Total downloads for that day |
| purchase_count | INT UNSIGNED | Total purchases for that day |
| unique_viewers | INT UNSIGNED | Unique viewers for that day |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Last update |

**Unique Key**: (movie_id, view_date) - one record per movie per day.

---

### 25. `platform_statistics`
**Purpose**: Daily platform-wide aggregated statistics for dashboards.

| Column | Type | Description |
|--------|------|-------------|
| id | INT UNSIGNED PK | Auto-increment ID |
| stat_date | DATE UNIQUE | Date of statistics |
| total_users | INT UNSIGNED | Total registered users |
| new_users | INT UNSIGNED | New users on that date |
| total_movies | INT UNSIGNED | Total movies in system |
| total_orders | INT UNSIGNED | Total orders on that date |
| total_revenue | DECIMAL(15,2) | Total revenue on that date |
| developer_commission | DECIMAL(15,2) | Developer commission on that date |
| owner_earnings | DECIMAL(15,2) | Owner earnings on that date |
| total_streams | INT UNSIGNED | Total streams on that date |
| total_downloads | INT UNSIGNED | Total downloads on that date |
| active_users | INT UNSIGNED | Active users on that date |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Last update |

---

## Index Strategy

1. **Primary Keys**: All tables use auto-increment INT UNSIGNED primary keys for efficient clustering and joins.
2. **Foreign Keys**: Every FK relationship is indexed for JOIN performance.
3. **Unique Constraints**: Applied to business keys (username, email, slug, order_number, receipt_number, ticket_number).
4. **Composite Indexes**: Used where queries filter by multiple columns (e.g., entity_type + entity_id).
5. **Fulltext Index**: On movies(title, description, short_description) for fast search.
6. **Descending Indexes**: On timestamp columns where latest-first ordering is common (popularity_score, created_at, published_at, last_watched_at).

## Performance Considerations

1. **BIGINT for high-volume tables**: activity_log, stream_log, download_log use BIGINT to avoid overflow.
2. **JSON columns**: Used for flexible/extensible data without schema changes.
3. **ENUM types**: Used for status fields with fixed value sets (more efficient than VARCHAR).
4. **Soft deletes**: Users and movies use soft delete to preserve referential integrity.
5. **CASCADE deletes**: Used where child records should be removed with parent (e.g., user sessions, library items).
6. **SET NULL**: Used where child records should survive parent deletion (e.g., activity logs).

## Future Scalability

1. **Sharding**: The `transactions`, `orders`, and `revenue_records` tables are designed with simple primary keys suitable for sharding.
2. **Archiving**: Activity logs older than 90 days are periodically cleaned via scheduled jobs.
3. **Caching**: Popular movies and dashboard statistics are good candidates for Redis caching.
4. **Read replicas**: Analytics queries can be directed to read replicas without schema changes.
