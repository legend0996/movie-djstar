# DJ Star Original Movies

Production-ready movie streaming platform with Node.js/Express backend, React frontend, Prisma ORM, JWT auth, Cloudflare R2 storage, and M-Pesa payments.

## Project Structure

```
DJ-Star-Original-Movies/
├── backend/          Node.js + Express API
│   ├── src/          Application source
│   ├── uploads/      Temporary uploads
│   ├── logs/         Log files
│   ├── package.json
│   └── Dockerfile
├── frontend/         React + Vite SPA
│   ├── src/          Application source
│   └── package.json
├── database/         Database layer
│   ├── prisma/       Schema, migrations, seeds
│   ├── sql/          Raw SQL scripts
│   └── ERD/          Entity-Relationship diagrams
├── docs/             Documentation
├── docker-compose.yml
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- MySQL 8+
- npm

### Quick Start

```bash
# 1. Install dependencies
cd backend && npm install
cd ../frontend && npm install
cd ..

# 2. Configure environment
cp backend/.env.example backend/.env
# Edit backend/.env with your credentials

# 3. Setup database
mysql -u root -p -e "CREATE DATABASE dj_star_movies"
cd backend
npx prisma migrate deploy
npx prisma db seed
cd ..

# 4. Start development servers
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

### Default Accounts

| Role | Email | Password |
|------|-------|----------|
| Developer | dev@djstarmovies.com | Admin@123456 |
| Movie Owner | owner@djstarmovies.com | Owner@123456 |
| Demo User | demo@djstarmovies.com | Demo@123456 |
| Test User | user@djstarmovies.com | User@123456 |

### Docker Setup

```bash
docker-compose up -d
```

## Tech Stack

### Backend
- **Runtime**: Node.js 18+ / Express.js
- **ORM**: Prisma + MySQL 8+
- **Auth**: JWT (access + refresh tokens), bcrypt
- **Storage**: Cloudflare R2 (S3-compatible)
- **Payments**: Safaricom M-Pesa Buy Goods
- **Email**: Nodemailer (SMTP)
- **Real-time**: Socket.io (notifications)
- **Validation**: Joi
- **Logging**: Winston
- **Security**: Helmet, CORS, Rate Limiting, XSS Protection
- **Testing**: Jest + Supertest

### Frontend
- **Framework**: React 18
- **Build**: Vite 5
- **Routing**: React Router 6
- **Data Fetching**: TanStack Query + Axios
- **Styling**: Tailwind CSS
- **State**: React Context

## API Endpoints

| Prefix | Description |
|--------|-------------|
| `/api/auth` | Registration, 2-step login, verification, profile |
| `/api/movies` | Catalog, search, categories, library, progress |
| `/api/stream` | Streaming, download, signed URLs |
| `/api/payments` | Purchase, M-Pesa callbacks, receipts |
| `/api/admin` | Dashboards, uploads, user management, analytics |
| `/api/support` | Support tickets, replies |
| `/api/notifications` | In-app notification center |
| `/api/health` | Health check with DB status |

## Documentation

- [API Reference](docs/API.md) - Complete API documentation
- [System Architecture](docs/SYSTEM_ARCHITECTURE.md) - Architecture overview
- [Database Schema](docs/DATABASE.md) - Database documentation
- [Security](docs/SECURITY.md) - Security architecture
- [Streaming](docs/STREAMING.md) - Streaming system design
- [M-Pesa Integration](docs/MPESA.md) - Payment integration guide
- [Deployment](docs/DEPLOYMENT.md) - Production deployment guide

## Features

- ✅ 2-step authentication with JWT tokens
- ✅ Role-based access control (User/Movie Owner/Developer)
- ✅ Email verification & password reset
- ✅ Movie CRUD with categories, tags, search
- ✅ Cloudflare R2 storage for movies/posters/trailers
- ✅ HTTP Range Request streaming (206 Partial Content)
- ✅ Authenticated download with signed URLs
- ✅ M-Pesa STK Push payments
- ✅ Purchase receipts & email notifications
- ✅ User library & playback progress tracking
- ✅ Support ticket system
- ✅ In-app notifications
- ✅ Admin dashboards with analytics
- ✅ Audit logging
- ✅ Rate limiting & security headers
- ✅ Scheduled cleanup jobs
- ✅ WebSocket real-time notifications
