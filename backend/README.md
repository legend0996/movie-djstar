# DJ Star Original Movies - Backend API

Production-ready REST API for a premium movie streaming platform. Built with Node.js, Express, Prisma ORM, MySQL, JWT authentication, Cloudflare R2 storage, and M-Pesa payments.

## Architecture

```
src/
├── config/         Environment config with Joi validation
├── controllers/    Request handlers (thin, delegate to services)
├── services/       Business logic layer
├── repositories/   Prisma-based database access
├── middleware/     Auth, validation, rate limiting, security
├── validators/     Joi validation schemas
├── routes/         Express route definitions
├── sockets/        WebSocket real-time notifications
├── jobs/           Scheduled cleanup & analytics
├── utils/          Logger, errors, helpers, response
├── emails/         Email HTML templates
├── tests/          Unit & integration tests
├── constants/      App-wide constants
├── app.js          Express app setup
└── server.js       Entry point with HTTP server
```

## Quick Start

```bash
cp .env.example .env
# Edit .env with your credentials

npx prisma migrate deploy
npm run seed
npm run dev
```

## API Endpoints

| Prefix | Description |
|--------|-------------|
| `/api/auth` | Registration, login, verification, profile |
| `/api/movies` | Movie catalog, search, library |
| `/api/stream` | Streaming, download, signed URLs |
| `/api/payments` | M-Pesa purchase, callbacks, receipts |
| `/api/admin` | Dashboards, uploads, user management |
| `/api/support` | Support tickets |
| `/api/notifications` | In-app notifications |
| `/api/health` | Health check |

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **ORM**: Prisma + MySQL 8
- **Auth**: JWT (access + refresh tokens)
- **Storage**: Cloudflare R2 (S3-compatible)
- **Payments**: Safaricom M-Pesa Buy Goods
- **Email**: Nodemailer (SMTP)
- **Logging**: Winston
- **Validation**: Joi
- **Security**: Helmet, CORS, Rate Limiting
- **Real-time**: Socket.io
- **Scheduling**: node-cron
- **Testing**: Jest + Supertest
