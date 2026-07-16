# DJ Star Original Movies - Backend API

Production-ready backend for a commercial movie platform built with Node.js, Express, MySQL, JWT authentication, Cloudflare R2 storage, and Safaricom M-Pesa Buy Goods payments.

## Features

- **Authentication**: Registration, login (2-step), email verification, password reset, JWT with refresh tokens, RBAC (User/Movie Owner/Developer)
- **Movie Management**: CRUD, categories, search (fulltext), metadata, pricing, visibility control
- **Cloud Storage**: Cloudflare R2 integration for secure movie, poster, and trailer storage
- **Streaming**: HTTP Range Request support, seeking, buffering, ownership verification
- **Downloads**: Secure downloads with temporary signed URLs, unlimited re-downloads
- **Payments**: M-Pesa Buy Goods STK Push, transaction management, idempotent callbacks
- **Library**: Permanent ownership records, purchase history, continue watching, playback progress
- **Administration**: Movie Owner dashboard, Developer dashboard, user management, audit logs
- **Support**: Ticket system with priority levels, staff replies, email notifications
- **Notifications**: In-app notification center with read/unread tracking
- **Analytics**: Pre-aggregated daily statistics, revenue reports, user growth tracking
- **Security**: Rate limiting, input validation, helmet headers, parameterized queries, bcrypt hashing

## Quick Start

```bash
npm install
cp .env.example .env
# Configure .env with your database, R2, M-Pesa, and SMTP credentials

mysql -u root -p -e "CREATE DATABASE dj_star_movies"
npm run migrate
npm run seed
npm run dev
```

Default accounts (after seeding):
- Developer: `dev@djstarmovies.com` / `Admin@123456`
- Movie Owner: `owner@djstarmovies.com` / `Owner@123456`
- Demo User: `demo@djstarmovies.com` / `Demo@123456`

## Documentation

- [API Documentation](docs/API.md) - Complete API reference for frontend developers
- [Database Schema](docs/DATABASE.md) - Full database documentation
- [R2 Setup Guide](docs/R2_SETUP.md) - Cloudflare R2 configuration
- [Setup Guide](docs/SETUP.md) - Installation and deployment
- [Deployment Checklist](docs/DEPLOYMENT_CHECKLIST.md) - Production readiness

## Tech Stack

- Node.js + Express.js
- MySQL 8+ (mysql2 with connection pooling)
- JWT Authentication (access + refresh tokens)
- Cloudflare R2 (S3-compatible API)
- Safaricom M-Pesa Buy Goods (STK Push)
- Nodemailer (SMTP email)
- Winston (logging)
- Joi (validation)
- Helmet, CORS, Compression
- node-cron (scheduled jobs)

## Project Structure

```
src/
├── config/        - Environment-based configuration
├── controllers/   - Request handlers
├── jobs/          - Scheduled cleanup & aggregation tasks
├── middleware/     - Auth, validation, rate limiting, error handling
├── repositories/  - Database access layer
├── routes/        - Express route definitions
├── services/      - Business logic layer
├── templates/     - Email templates
├── utils/         - Shared utilities & error classes
├── validators/    - Joi validation schemas
└── app.js         - Express application setup
```
