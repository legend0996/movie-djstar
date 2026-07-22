# Database Documentation

## Overview

MySQL 8+ relational database with 26 tables, 9 enums, and full-text search support. Managed via Prisma ORM (27 Prisma models).

## Schema

The complete schema is defined in `database/prisma/schema.prisma` (746 lines).

### Tables

| # | Table | Purpose |
|---|-------|---------|
| 1 | `roles` | RBAC roles (user, movie_owner, developer) |
| 2 | `users` | User accounts with auth and profile data |
| 3 | `verification_codes` | Email verification and password reset codes |
| 4 | `user_sessions` | JWT session management |
| 5 | `user_activity_log` | User activity tracking |
| 6 | `categories` | Movie categories with hierarchy |
| 7 | `movies` | Movie catalog with metadata and pricing |
| 8 | `movie_files` | Multi-quality video files |
| 9 | `movie_tags` | Tag definitions |
| 10 | `movie_tag_pivot` | Movie-tag associations |
| 11 | `user_library` | User movie ownership |
| 12 | `playback_progress` | Resume playback positions |
| 13 | `download_log` | Download history |
| 14 | `stream_log` | Streaming history |
| 15 | `transactions` | M-Pesa payment transactions |
| 16 | `orders` | Purchase orders |
| 17 | `order_items` | Order line items |
| 18 | `receipts` | Purchase receipts |
| 19 | `revenue_records` | Revenue and commission records |
| 20 | `audit_logs` | Admin audit trail |
| 21 | `support_tickets` | Customer support tickets |
| 22 | `support_ticket_replies` | Ticket replies |
| 23 | `notifications` | In-app notifications |
| 24 | `system_configurations` | Key-value configuration store |
| 25 | `movie_views_daily` | Daily view aggregation |
| 26 | `platform_statistics` | Daily platform metrics |

### Key Relationships

```
Role (1) ──> User (many)
User (1) ──> Movie (many) [as creator]
User (1) ──> VerificationCode (many)
User (1) ──> UserSession (many)
User (1) ──> Order (many)
User (1) ──> Transaction (many)
User (1) ──> UserLibrary (many)
User (1) ──> PlaybackProgress (many)
User (1) ──> SupportTicket (many)
User (1) ──> Notification (many)

Category (1) ──> Movie (many)
Movie (1) ──> MovieFile (many)
Movie (1) ──> MovieTagPivot (many)
Movie (1) ──> UserLibrary (many)
Movie (1) ──> PlaybackProgress (many)
Movie (1) ──> StreamLog (many)
Movie (1) ──> DownloadLog (many)
Movie (1) ──> MovieViewsDaily (many)

Order (1) ──> OrderItem (many)
Order (1) ──> Receipt (many)
Order (1) ──> RevenueRecord (many)

Transaction (1) ──> RevenueRecord (many)

SupportTicket (1) ──> SupportTicketReply (many)
Movie (1) ──> Movie (self) [series/episodes]
Category (1) ──> Category (self) [parent/children]
```

### Enums

- **RoleSlug**: `user`, `movie_owner`, `developer`
- **UserStatus**: `active`, `unverified`, `suspended`, `disabled`, `deleted`
- **MovieStatus**: `draft`, `published`, `hidden`, `archived`, `unavailable`
- **OrderStatus**: `pending`, `processing`, `completed`, `failed`, `refunded`, `partially_refunded`
- **PaymentStatus**: `pending`, `paid`, `failed`, `refunded`
- **TransactionStatus**: `pending`, `processing`, `successful`, `failed`, `cancelled`, `expired`, `reversed`
- **TicketPriority**: `low`, `medium`, `high`, `urgent`
- **TicketStatus**: `open`, `in_progress`, `waiting_on_customer`, `resolved`, `closed`
- **VerificationType**: `email_verification`, `password_reset`, `email_change`, `phone_verification`

### Indexes

- Full-text index on `movies(title, description, short_description)`
- Composite indexes on all foreign keys
- Unique constraints on business keys (username, email, slug, order_number, etc.)
- Composite unique on `user_library(user_id, movie_id)` and `playback_progress(user_id, movie_id)`

## Migrations

```bash
# Generate Prisma client
npx prisma generate

# Create a new migration
npx prisma migrate dev --name description_of_change

# Apply migrations in production
npx prisma migrate deploy

# Reset database (dev only)
npx prisma migrate reset
```

## Seed Data

```bash
# Seed the database with initial data
node database/prisma/seed.js
# or
npx prisma db seed
```

Seeded data:
- 3 roles (user, movie_owner, developer)
- 11 system configurations
- 10 categories
- 4 user accounts (developer, movie_owner, demo, test)
- 14 movies (all priced at KES 20.00, no free movies)

## Backup

```bash
# Backup
mysqldump -u root -p dj_star_movies > backup.sql

# Restore
mysql -u root -p dj_star_movies < backup.sql
```
