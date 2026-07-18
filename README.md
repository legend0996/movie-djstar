# DJ Star Original Movies

Production-ready movie streaming platform with Node.js/Express backend, React frontend, Prisma ORM, JWT auth, Cloudflare R2 storage, and M-Pesa payments.

## Architecture

```
root/
├── backend/              Express API server (port 5000)
│   ├── src/
│   │   ├── config/       Env validation (Joi), DB connection (Prisma)
│   │   ├── constants/    Enums: ROLES, STATUS, SORT_OPTIONS, MOVIE_STATUS
│   │   ├── controllers/  Thin route handlers (7 controllers)
│   │   ├── middleware/   auth, validate, rateLimiter, upload, cors, security
│   │   ├── repositories/ Data access layer via Prisma (11 repos)
│   │   ├── services/     Business logic layer (10 services)
│   │   ├── routes/       Express routers (7 route files)
│   │   ├── validators/   Joi schemas
│   │   ├── utils/        Logger (Winston), errors (AppError hierarchy), helpers
│   │   ├── sockets/      Socket.io real-time notifications
│   │   ├── jobs/         node-cron scheduled tasks (cleanup, analytics)
│   │   ├── tests/        Jest + Supertest (unit/, integration/, helpers/)
│   │   └── app.js        Express app setup (does not listen)
│   ├── jest.config.js
│   ├── test.env
│   ├── .env.example
│   └── Dockerfile
├── frontend/             Vite + React SPA (port 3002)
│   ├── src/
│   │   ├── api/          Axios client w/ token refresh interceptor
│   │   ├── components/   Shared UI: MovieCard, HeroCarousel, ReviewSection, etc.
│   │   ├── constants/    ROLES, STATUS, SORT_OPTIONS enums
│   │   ├── context/      AuthContext (login state, tokens)
│   │   ├── hooks/        useFetch(key, url), usePost(url), usePut(url)
│   │   ├── layouts/      MainLayout (navbar + footer), AdminLayout (sidebar)
│   │   ├── pages/        movies/, auth/, library/, support/, admin/
│   │   ├── styles/       index.css (Tailwind + @layer components)
│   │   └── utils/        formatCurrency, formatDate, etc.
│   ├── tailwind.config.js
│   └── vite.config.js    Proxies /api → localhost:5000
├── database/
│   ├── prisma/
│   │   ├── schema.prisma 23 models, MySQL 8 provider
│   │   └── seed.js       14 movies, 4 users, 10 categories
│   ├── migrate.js
│   └── seed.js
├── docs/                 API.md, DATABASE.md, DEPLOYMENT.md, SECURITY.md, etc.
├── docker-compose.yml    backend + mysql:8.0 + redis:7-alpine
└── AGENTS.md             AI assistant context & conventions
```

## Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js 18+ / Express 4 | HTTP server & routing |
| Prisma 5 / MySQL 8 | ORM & database |
| JWT (access + refresh) | Authentication |
| bcryptjs | Password hashing |
| Socket.io | Real-time notifications |
| Winston | Logging (console + file) |
| Helmet | Security headers |
| express-rate-limit | Rate limiting |
| Joi | Request validation |
| Multer | File uploads |
| node-cron | Scheduled jobs |
| Nodemailer | Email (SMTP) |

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI framework |
| Vite 5 | Build tool & dev server |
| React Router 6 | Client-side routing |
| TanStack Query 5 | Server state & caching |
| Axios | HTTP client |
| TailwindCSS 3 | Utility-first CSS |
| Framer Motion 12 | Animations |
| React Context | Auth state management |

### Infrastructure
| Service | Purpose |
|---------|---------|
| Cloudflare R2 | Movie/poster/trailer storage (S3-compatible) |
| Safaricom M-Pesa | Payment processing (Buy Goods Till) |
| Docker Compose | Local development (backend + MySQL + Redis) |
| Redis 7 | Caching & rate limiting |

## Getting Started

### Prerequisites
- Node.js 18+
- MySQL 8+
- npm / yarn

### Quick Start

```bash
# Install dependencies
cd backend && npm install
cd ../frontend && npm install
cd ..

# Configure environment
cp backend/.env.example backend/.env
# Edit backend/.env with your database and service credentials

# Create database
mysql -u root -p -e "CREATE DATABASE dj_star_movies"

# Run setup (migrate + seed)
cd backend
npx prisma migrate deploy
npx prisma db seed
cd ..

# Start development servers (two terminals)
cd backend && npm run dev     # → localhost:5000
cd frontend && npm run dev    # → localhost:3002
```

### Docker Setup

```bash
docker-compose up -d
```

### Default Accounts

| Role | Email | Password |
|------|-------|----------|
| Developer | dev@djstarmovies.com | Admin@123456 |
| Movie Owner | owner@djstarmovies.com | Owner@123456 |
| Demo User | demo@djstarmovies.com | Demo@123456 |
| Test User (unverified) | user@djstarmovies.com | User@123456 |

## Development

### Commands

```bash
# Backend
cd backend
npm run dev             # Nodemon hot-reload on :5000
npm test                # Jest --forceExit --detectOpenHandles (112 tests)
npm run lint            # ESLint
npm run lint:fix        # ESLint auto-fix
npm run format          # Prettier
npx prisma studio       # Prisma GUI at :5555
npm run seed            # Reset seed data

# Frontend
cd frontend
npm run dev             # Vite dev server on :3002
npm run build           # Production build
npm run preview         # Preview production build
```

### Code Conventions

- **Repository pattern**: All database queries in `src/repositories/`, never in services
- **Service pattern**: Business logic in `src/services/`, controllers are thin
- **Validation**: Joi schemas in `src/validators/`, applied via `validate(schema, 'body')` middleware
- **Error handling**: Custom AppError subclasses (NotFoundError, UnauthorizedError, etc.) caught by centralized error handler
- **Response format**: `{ success: true/false, data, message, errorCode }`
- **Frontend API hooks**: `useFetch(key, url)` (NOT `useFetch(url, key)`), `usePost(url, opts)`, `usePut(url, opts)`

### Important Routing Rules

- Movie detail: `GET /api/movies/slug/:slug` (separate from `GET /api/movies/:id`)
- Protected routes use `<ProtectedRoute roles={['role_name']} />`
- Redirects to `/login?redirect=...` if unauthenticated

## Testing

### Test Configuration

- **Framework**: Jest 29 + Supertest 7
- **Setup**: `backend/src/tests/setup.js` runs before all tests
- **Mocking**: Prisma (Proxy-based), all repositories, logger, activityLogger, external services (email, R2, M-Pesa)
- **Env**: `backend/test.env` loaded automatically
- **Pattern**: `**/src/tests/**/*.test.js`

### Running Tests

```bash
cd backend
npm test                         # All 112 tests
npx jest --verbose               # Detailed output
npx jest src/tests/unit/         # Unit tests only
npx jest src/tests/integration/  # Integration tests only
npx jest -t "authService"        # Filter by test name
```

### Test Architecture

| Directory | Type | Tests |
|-----------|------|-------|
| `unit/services/` | Service unit tests | authService, reviewService |
| `unit/utils/` | Utility unit tests | helpers, errors, response |
| `integration/` | API integration tests | auth, movies, stream, payments, admin, support, notifications |

### Recent Test Fixes (July 2026)

All 112 tests now pass. Key fixes applied:

- **Mock ordering**: `jest.mock()` must appear before `require()` calls (Jest config uses `transform: {}`, so mocks are NOT hoisted)
- **Notification service**: Removed from setup.js mocks — integration tests use the real service with mocked repository
- **Stream tests**: Replaced `MockReadable` with `PassThrough` + delayed `.end()` to avoid supertest pipe abort
- **M-Pesa callback**: Added `mpesaService.verifyCallback` mock return value
- **Auth service**: Fixed camelCase property names (`loginAttempts` not `login_attempts`) in test factory

Seeded users and movies have predictable IDs and properties via `createMockUser()` / `createMockMovie()` helper functions in `src/tests/helpers/testFactory.js`.

## API Endpoints

| Prefix | Auth | Description |
|--------|------|-------------|
| `GET /api/health` | None | Health check with DB status |
| `POST /api/auth/register` | None | User registration |
| `POST /api/auth/login` | None | 2-step login (step 1: identify, step 2: verify password) |
| `POST /api/auth/refresh` | None | Refresh access token |
| `POST /api/auth/logout` | Required | Revoke session |
| `GET /api/movies` | Optional | Browse movies (paginated, filterable, sortable) |
| `GET /api/movies/slug/:slug` | Optional | Movie detail by slug |
| `GET /api/movies/:id` | Optional | Movie detail by ID |
| `GET /api/movies/popular` | None | Popular movies |
| `GET /api/movies/featured` | None | Featured movies |
| `GET /api/movies/categories` | None | All categories |
| `POST /api/movies/reviews/:id` | Required | Create review |
| `GET /api/stream/trailer/:id` | None | Stream trailer (HTTP Range) |
| `GET /api/stream/movie/:id` | Required | Stream movie (HTTP Range) |
| `GET /api/stream/download/:id` | Required | Download movie |
| `POST /api/payments/purchase` | Required | Initiate M-Pesa STK push |
| `POST /api/payments/mpesa-callback` | None | M-Pesa callback webhook |
| `GET /api/payments/history` | Required | Purchase history |
| `GET /api/support` | Required | User support tickets |
| `POST /api/support` | Required | Create support ticket |
| `POST /api/support/:id/reply` | Required | Reply to ticket |
| `GET /api/notifications` | Required | User notifications |
| `PUT /api/notifications/:id/read` | Required | Mark notification read |
| `GET /api/admin/dashboard` | Admin | Analytics dashboard |
| `POST /api/admin/movies` | Admin | Create/upload movie |

Full API documentation in [docs/API.md](docs/API.md).

## Features

### Authentication & Security
- ✅ 2-step login (identify → verify password)
- ✅ JWT access + refresh token rotation
- ✅ Email verification & password reset
- ✅ Role-based access control (User / Movie Owner / Developer)
- ✅ Account lockout after max login attempts
- ✅ Session management & revocation
- ✅ Helmet security headers + CORS + rate limiting

### Movie Management
- ✅ Full CRUD with categories, tags, search
- ✅ Poster/trailer upload to Cloudflare R2
- ✅ HTTP Range-request streaming (206 Partial Content)
- ✅ Download with signed URLs
- ✅ User library & playback progress tracking
- ✅ Review system (1-5 stars)

### Payments (M-Pesa)
- ✅ STK Push initiation
- ✅ Callback handling with duplicate detection
- ✅ Order & transaction lifecycle management
- ✅ Receipt generation & email delivery
- ✅ Revenue tracking with developer commission
- ✅ Automatic purchase timeout handling

### User Features
- ✅ Profile management
- ✅ Purchase history & receipts
- ✅ Support ticket system with replies
- ✅ In-app notification center
- ✅ Real-time notifications via Socket.io
- ✅ Continue watching (playback progress)

### Admin
- ✅ Dashboard with analytics (revenue, users, movies)
- ✅ Movie upload workflow (draft → review → publish)
- ✅ User management (suspend, verify)
- ✅ Support ticket management
- ✅ Developer tools & system configuration

### Infrastructure
- ✅ Docker Compose for local development
- ✅ Cloudflare R2 storage (S3-compatible)
- ✅ Winston logging (console + file, with audit & payment logs)
- ✅ Scheduled cleanup jobs (expired sessions, codes, temp files)
- ✅ Daily analytics aggregation
- ✅ Comprehensive audit logging

## Database

- **23 models** covering users, roles, movies, orders, payments, support, notifications, analytics
- Prisma ORM with MySQL 8 provider
- `@map("snake_case")` for columns, `@@map("snake_case_plural")` for tables
- Key models: User, Role, Movie, Category, Order, Transaction, Receipt, UserLibrary, SupportTicket, Notification, AuditLog, PlatformStatistic

Full schema documentation in [docs/DATABASE.md](docs/DATABASE.md).

## Design System

### Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `brand-primary` | `#E50914` | Buttons, links, accents |
| `brand-hover` | `#F40612` | Button hover states |
| `brand-bg` | `#0B0B0B` | Page background |
| `brand-surface` | `#181818` | Navbar, footer, sections |
| `brand-card` | `#202020` | Cards, dropdowns, modals |
| `brand-border` | `#2B2B2B` | Borders, dividers |
| `brand-accent` | `#F5C518` | Ratings, highlights |

### Component Classes

| Class | Usage |
|-------|-------|
| `btn-primary` / `btn-secondary` / `btn-ghost` / `btn-danger` | Buttons |
| `input-field` / `label` | Form elements |
| `card-base` / `glass` | Cards & glassmorphism |
| `badge` / `badge-success` / `badge-warning` / `badge-error` | Status badges |
| `skeleton` | Loading pulse animation |
| `line-clamp-2` / `line-clamp-3` | Text truncation |

### Global Styles
- Body: `#0B0B0B` background, white text
- Custom scrollbar matching brand surface color
- `::selection` uses brand primary with 30% opacity
- Headings: Poppins (`font-heading`), Body: Inter (`font-sans`)

## Production Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed production deployment guide.

### Quick Checklist
- [ ] Set `NODE_ENV=production` in backend
- [ ] Configure MySQL 8 with proper credentials
- [ ] Set up Cloudflare R2 bucket and credentials
- [ ] Configure M-Pesa API keys (consumer key, secret, passkey)
- [ ] Set SMTP credentials for transactional emails
- [ ] Configure JWT secrets (long, random strings)
- [ ] Build frontend: `cd frontend && npm run build`
- [ ] Use PM2 or Docker for process management
- [ ] Enable HTTPS (reverse proxy with Nginx/Caddy)
- [ ] Run `npx prisma migrate deploy` for production migrations
