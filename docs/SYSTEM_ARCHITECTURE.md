# System Architecture

## Overview

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Frontend   │ ──> │  Express API  │ ──> │   MySQL DB  │
│  (React/Vite)│ <── │  (Node.js)   │ <── │  (Prisma)   │
└─────────────┘     └──────┬───────┘     └─────────────┘
                           │
                    ┌──────┴───────┐
                    │  Cloudflare  │
                    │   R2 Storage │
                    └──────────────┘
                    ┌──────┴───────┐
                    │  M-Pesa API  │
                    │  (Safaricom) │
                    └──────────────┘
                    ┌──────┴───────┐
                    │    SMTP      │
                    │   (Email)    │
                    └──────────────┘
```

## Layers

### 1. Routes
Define URL patterns and attach middleware chains. No business logic.

### 2. Middleware
- **auth.js**: JWT verification, RBAC
- **validate.js**: Schema validation via Joi
- **upload.js**: Multer file handling
- **rateLimiter.js**: express-rate-limit
- **sanitize.js**: XSS sanitization
- **security.js**: Helmet + custom headers
- **errorHandler.js**: Centralized error handling

### 3. Controllers
Thin request handlers that:
- Parse request data
- Call service methods
- Format responses via `utils/response.js`

### 4. Services
Business logic layer that:
- Orchestrates multi-step operations
- Coordinates between repositories
- Handles cross-cutting concerns (logging, notifications)

### 5. Repositories
Database access layer that:
- Encapsulates all Prisma queries
- Returns clean JavaScript objects
- No business logic

## Data Flow

```
Client Request
    ↓
Route → Middleware Chain
    ↓
Controller (parse req, call service)
    ↓
Service (business logic, orchestrate)
    ↓
Repository (Prisma query → MySQL)
    ↓
Response ← Controller (format via response.js)
    ↓
Client
```

## Authentication Flow

```
Register → Email verification code → Verify Email → Active
Login Step 1 (check user exists)
Login Step 2 (password verify) → JWT tokens
Refresh Token → New token pair
Logout → Revoke session
```

## Payment Flow

```
User initiates purchase
    ↓
Backend creates order + transaction
    ↓
M-Pesa STK Push sent to phone
    ↓
User enters PIN on phone
    ↓
M-Pesa callback → verify → update DB
    ↓
Add to library + generate receipt
    ↓
Email receipt + in-app notification
```

## Streaming Flow

```
User requests stream
    ↓
Authenticate + verify ownership
    ↓
Proxy request to R2 (hidden URL)
    ↓
HTTP Range Requests (206 Partial Content)
    ↓
Log stream + update analytics
```
