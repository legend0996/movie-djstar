# Database - DJ Star Original Movies

## Overview

MySQL 8+ database with Prisma ORM. Contains 25 tables, 7 enums, full-text search, and comprehensive indexing.

## Schema

The database schema is defined in `prisma/schema.prisma` (746 lines, 25 models).

### Core Tables
- **users** - User accounts with roles, status, auth tracking
- **roles** - RBAC roles (user, movie_owner, developer)
- **movies** - Movie catalog with metadata, pricing, visibility
- **categories** - Movie categories with parent-child hierarchy
- **movie_files** - Multi-quality video files per movie
- **movie_tags** & **movie_tag_pivot** - Tagging system

### Commerce
- **orders** & **order_items** - Purchase orders
- **transactions** - M-Pesa payment transactions
- **receipts** - Purchase receipts
- **revenue_records** - Commission splitting (developer 40%, owner 60%)
- **user_library** - Permanent ownership records

### Streaming
- **playback_progress** - Resume playback positions
- **stream_log** & **download_log** - Usage tracking

### User Features
- **notifications** - In-app notification center
- **support_tickets** & **support_ticket_replies** - Support system
- **verification_codes** - Email verification & password reset
- **user_sessions** - JWT session management

### Admin & Analytics
- **audit_logs** - Comprehensive audit trail
- **user_activity_log** - User activity tracking
- **movie_views_daily** - Daily view aggregation
- **platform_statistics** - Daily platform metrics
- **system_configurations** - Key-value config store

## Key Relationships

```
Role 1---* User
User 1---* Movie (creator)
Category 1---* Movie
Movie 1---* MovieFile
Movie 1---* OrderItem
User 1---* Order
Order 1---* OrderItem
Order 1---* Receipt
User 1---* Transaction
User 1---* UserLibrary
User 1---* PlaybackProgress
User 1---* SupportTicket
SupportTicket 1---* SupportTicketReply
User 1---* Notification
```

## Enums

- RoleSlug: user, movie_owner, developer
- UserStatus: active, unverified, suspended, disabled, deleted
- MovieStatus: draft, published, hidden, archived, unavailable
- OrderStatus: pending, processing, completed, failed, refunded, partially_refunded
- PaymentStatus: pending, paid, failed, refunded
- TransactionStatus: pending, processing, successful, failed, cancelled, expired, reversed
- TicketPriority: low, medium, high, urgent
- TicketStatus: open, in_progress, waiting_on_customer, resolved, closed
- VerificationType: email_verification, password_reset, email_change, phone_verification

## Commands

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Create new migration
npx prisma migrate dev --name <name>

# Seed database
node database/prisma/seed.js

# Open Prisma Studio (GUI)
npx prisma studio
```

## Files

| File | Description |
|------|-------------|
| `prisma/schema.prisma` | Main schema definition |
| `prisma/seed.js` | Seed script (dev@djstarmovies.com) |
| `sql/schema.sql` | Raw SQL schema |
| `sql/indexes.sql` | Performance indexes |
| `sql/triggers.sql` | Database triggers |
| `sql/procedures.sql` | Stored procedures |
| `sql/backup.sql` | Backup/restore script |
| `ERD/` | Entity-Relationship diagrams |
