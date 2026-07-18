# AGENTS.md — DJ Star Original Movies

## Project Structure
```
root/
├── backend/          # Express API server (port 5000)
│   ├── src/
│   │   ├── config/           # Env validation & DB connection
│   │   ├── constants/        # Enums & role constants
│   │   ├── controllers/      # Route handlers (thin)
│   │   ├── middleware/       # auth, validate, rateLimiter, upload, etc.
│   │   ├── repositories/    # Prisma queries (data access layer)
│   │   ├── services/        # Business logic layer
│   │   ├── routes/          # Express routers
│   │   ├── tests/           # Jest + Supertest (unit/ dir, integration/ dir)
│   │   ├── validators/      # Joi schemas
│   │   ├── utils/           # Logger (winston), errors, helpers
│   │   ├── sockets/         # Socket.io
│   │   ├── jobs/            # node-cron scheduled tasks
│   │   └── app.js           # Express app setup (no listen)
│   ├── jest.config.js
│   └── test.env
├── frontend/         # Vite + React SPA (port 3002)
│   ├── src/
│   │   ├── api/              # Axios client w/ token refresh interceptor
│   │   ├── components/       # Shared UI components
│   │   ├── constants/        # ROLES, STATUS, SORT_OPTIONS enums
│   │   ├── context/          # AuthContext
│   │   ├── hooks/            # useFetch, usePost, usePut
│   │   ├── layouts/          # MainLayout, AdminLayout
│   │   ├── pages/            # movies/, auth/, library/, support/, admin/
│   │   ├── styles/           # index.css (Tailwind + component classes)
│   │   └── utils/            # format helpers
│   ├── tailwind.config.js
│   └── vite.config.js       # proxy /api → localhost:5000
├── database/
│   ├── prisma/
│   │   ├── schema.prisma     # 23 models, MySQL provider
│   │   └── seed.js           # 14 movies, 4 users, 10 categories
│   ├── migrate.js
│   └── seed.js
├── docs/             # API.md, DATABASE.md, DEPLOYMENT.md, etc.
└── docker-compose.yml        # backend + mysql:8.0 + redis:7-alpine
```

## Tech Stack
- **Frontend**: React 18, Vite 5, TailwindCSS 3, Framer Motion 12, React Router 6, Axios, TanStack React Query 5
- **Backend**: Express 4, Prisma 5 (MySQL 8), JWT, Socket.io, Winston, Helmet, Compression, Rate Limiting, Joi validation, Multer, node-cron
- **Testing**: Jest 29 + Supertest 7
- **Payments**: M-Pesa Buy Goods (Till Number)
- **Storage**: Cloudflare R2 (S3-compatible)
- **Infrastructure**: Docker Compose (backend + MySQL + Redis)

## Build/Run Commands
```
# Frontend
npm run dev          # → localhost:3002
npm run build        # Vite production build

# Backend
npm run dev          # → localhost:5000 (nodemon)
npm test             # Jest --forceExit --detectOpenHandles
npx prisma migrate deploy  # Apply migrations
npm run seed         # node database/prisma/seed.js
npm run setup        # install + prisma generate + migrate + seed
npx prisma studio    # Prisma GUI
npm run lint / lint:fix / format
```

## Brand Design System

### Colors (tailwind.config.js `brand.*`)
| Token       | Hex       | Usage                    |
|-------------|-----------|--------------------------|
| primary     | `#E50914` | Buttons, links, accents  |
| hover       | `#F40612` | Button hover states      |
| bg          | `#0B0B0B` | Page background          |
| surface     | `#181818` | Navbar, footer, sections |
| card        | `#202020` | Cards, dropdowns, modals |
| border      | `#2B2B2B` | Borders, dividers        |
| accent      | `#F5C518` | Ratings, highlights      |

### Fonts
- **Headings**: `Poppins` (via `font-heading` class, applied globally to h1-h6)
- **Body**: `Inter` (via `font-sans`, applied globally to body)

### CSS Component Classes (index.css `@layer components`)
- **Buttons**: `btn-primary`, `btn-secondary`, `btn-ghost`, `btn-danger`
- **Form**: `input-field`, `label`
- **Layout**: `card-base`, `glass`, `section-title`, `section-header`
- **Status**: `badge`, `badge-success`, `badge-warning`, `badge-error`, `badge-info`, `badge-default`
- **Utilities**: `skeleton` (pulse), `scrollbar-hide`, `line-clamp-2`, `line-clamp-3`
- **Global**: body bg `#0B0B0B`, white text, custom scrollbar, `::selection` brand-primary/30

## Frontend Component Patterns
- **useFetch(key, url, options)** — key is queryKey, url is the API path. NOT `useFetch(url, key)`. From `src/hooks/useApi.js`.
- **usePost(url, { invalidate: ['key'], onSuccess })**, **usePut(url, options)** — auto-invalidate on success.
- **AnimatePresence mode="wait"** wraps `<Routes>` in App.jsx.
- **Page transitions**: `motion.div` with `initial={{ opacity: 0, y: 12 }}` / `animate={{ opacity: 1, y: 0 }}` / `exit={{ opacity: 0, y: -12 }}` on Outlet.
- **Section animations**: `motion.div` with `whileInView` + `viewport={{ once: true }}`.
- All Tailwind utilities; component classes via `@apply` in index.css.
- API client (`src/api/client.js`) auto-attaches Bearer token, handles 401 w/ refresh token rotation.

## Routing Pattern (App.jsx)
```
<AnimatePresence mode="wait">
  <Routes location={location} key={location.pathname}>
    <Route element={<MainLayout />}>  ← Navbar + Footer + SearchModal + Toast
      {/* Public routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/movies" element={<BrowsePage />} />
      <Route path="/movies/:slug" element={<MovieDetailPage />} />
      {/* Auth routes (no protection) */}
      <Route path="/login" ... />
      <Route path="/register" ... />
      ...
      {/* Protected user routes */}
      <Route element={<ProtectedRoute />}>  ← no roles = any authenticated user
        <Route path="/watch/:id" ... />
        <Route path="/my-library" ... />
        ...
      </Route>
    </Route>
    <Route element={<AdminLayout />}>  ← sidebar layout
      <Route element={<ProtectedRoute roles={['movie_owner','developer']} />}>
        <Route path="/admin/movies" ... />
        <Route path="/admin/support" ... />
      </Route>
      <Route element={<ProtectedRoute roles={['developer']} />}>
        <Route path="/admin/developer" ... />
        <Route path="/admin/users" ... />
      </Route>
    </Route>
  </Routes>
</AnimatePresence>
```
- **ProtectedRoute** takes optional `roles` array, renders `<Outlet />`.
- Redirects to `/login?redirect=...` if not authenticated; shows 403 if wrong role.

## Backend Patterns
- **Repository pattern**: 11 repositories in `src/repositories/` — each wraps Prisma queries.
- **Service pattern**: 10 services in `src/services/` — business logic layer.
- **Controllers**: 7 controllers — thin handlers calling services.
- **Auth middleware**: `authenticate` (JWT → req.user), `authorize(...roles)`, `optionalAuth`, `verifiedUser`, `activeUser`.
- **Validation**: Joi schemas in `src/validators/`, used via `validate(schema, 'body'|'query')` middleware.
- **Error handling**: Custom `AppError` subclasses caught by centralized `errorHandler`.
- **Routes**: 7 routers mounted in `app.js`: `/api/auth`, `/api/movies`, `/api/stream`, `/api/payments`, `/api/admin`, `/api/support`, `/api/notifications`.
- **Response format**: `{ success: true/false, data, message, errorCode }`.

## Known API Fixes (CRITICAL — do not regress)
1. **Movie slug route**: `GET /api/movies/slug/:slug` (NOT `/api/movies/:slug`). `:id` route is separate.
2. **useFetch(args)**: Signature is `useFetch(key, url)` — first arg is the query key, second is the URL string.

## Database
- **Provider**: MySQL 8 via Prisma ORM, schema at `database/prisma/schema.prisma`.
- **Schema**: `@map("snake_case")` for columns, `@@map("snake_case_plural")` for tables.
- **Key models**: Role, User, VerificationCode, UserSession, UserActivityLog, Category, Movie, MovieFile, MovieTag, MovieTagPivot, UserLibrary, PlaybackProgress, DownloadLog, StreamLog, Transaction, Order, OrderItem, Receipt, RevenueRecord, AuditLog, SupportTicket, SupportTicketReply, Notification, SystemConfiguration, MovieViewsDaily, PlatformStatistic.
- **Migration**: `npx prisma migrate deploy` for production, `npx prisma migrate dev` for development.

## Seed Data
- **4 users**: dev@djstarmovies.com / Admin@123456 (developer), owner@djstarmovies.com / Owner@123456 (movie_owner), demo@djstarmovies.com / Demo@123456 (user), user@djstarmovies.com / User@123456 (unverified user).
- **10 categories**: Action, Comedy, Drama, Romance, Thriller, Horror, Documentary, Animation, Science Fiction, Series.
- **14 movies** with posters (picsum.photos) and video (Big Buck Bunny sample).

## Test Setup
- **Config**: `jest.config.js` — `setupFiles: ['./src/tests/setup.js']`, matches `**/src/tests/**/*.test.js`.
- **Env**: `test.env` loaded via dotenv in setup.js.
- **Setup.js** (`backend/src/tests/setup.js`): Mocks Prisma (Proxy), logger, activityLogger, ALL repositories, and external services.
- Tests: unit/ and integration/ directories with a helpers/ directory.

## Config & Environment
- Backend: `backend/.env` (copy from `.env.example`); validated via Joi in `backend/src/config/index.js`.
- Frontend: `frontend/.env` with `VITE_API_URL` (defaults to `/api` proxied by Vite).
- Docker: `docker-compose.yml` maps backend:5000, mysql:3306, redis:6379.
- CORS: backend allows `http://localhost:3002`.
