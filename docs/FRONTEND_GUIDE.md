# DJ Star Original Movies - Frontend Development Guide

This guide explains everything a frontend developer needs to build the customer-facing app and admin dashboards for DJ Star Original Movies.

---

## Table of Contents

1. [Tech Stack Recommendations](#1-tech-stack-recommendations)
2. [Getting Started](#2-getting-started)
3. [Authentication Flow](#3-authentication-flow)
4. [API Integration Patterns](#4-api-integration-patterns)
5. [Page-by-Page Implementation Guide](#5-page-by-page-implementation-guide)
6. [Payment Flow](#6-payment-flow)
7. [Streaming & Downloads](#7-streaming--downloads)
8. [Admin Dashboards](#8-admin-dashboards)
9. [Error Handling](#9-error-handling)
10. [Important Rules](#10-important-rules)

---

## 1. Tech Stack Recommendations

| Technology | Why |
|-----------|-----|
| **React** (Vite) | Fast dev, good ecosystem |
| **React Router v6** | Client-side routing |
| **Axios** | HTTP client with interceptors |
| **Tailwind CSS** | Rapid UI development |
| **React Query / TanStack Query** | API caching, refetching |
| **React Player** | Video streaming (HLS/MP4) |

---

## 2. Getting Started

### Base URL
```
Development: http://localhost:5000/api
Production:  https://yourdomain.com/api
```

### API Client Setup (Axios Example)

```javascript
// api/client.js
import axios from 'axios'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
})

// Attach token to every request
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401 - redirect to login
client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('accessToken')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default client
```

---

## 3. Authentication Flow

The login has two steps. Build your UI accordingly.

### Step 1: Username Check
```
POST /auth/login/step1
Body: { "username": "johndoe" }

Response:
{ "success": true, "data": { "exists": true, "status": "active" } }
// or
{ "success": true, "data": { "exists": false } }
```

- If `exists: true` → show password field
- If `exists: false` → show "Account not found" message (do NOT say "username doesn't exist" — keep it vague for security)

### Step 2: Password Authentication
```
POST /auth/login/step2
Body: { "username": "johndoe", "password": "..." }

Response:
{
  "data": {
    "user": { "id": 1, "username": "johndoe", "role": "user", "status": "active" },
    "tokens": {
      "accessToken": "eyJ...",
      "refreshToken": "eyJ..."
    }
  }
}
```

Save both tokens in `localStorage`. Use `accessToken` for all authenticated requests.

### Registration
```
POST /auth/register
Body: {
  "username": "johndoe",
  "email": "john@example.com",
  "phone": "0712345678",
  "password": "StrongP@ss1",
  "confirmPassword": "StrongP@ss1",
  "firstName": "John",
  "lastName": "Doe"
}
```

After registration → show email verification screen.

### Email Verification
```
POST /auth/verify-email
Body: { "email": "john@example.com", "code": "123456" }
POST /auth/resend-verification
Body: { "email": "john@example.com" }
```

- Auto-focus the 6-digit input fields
- Allow resending after 60 seconds (frontend rate limit)
- Show countdown timer

### Password Reset
```
POST /auth/forgot-password   → sends code to email
POST /auth/reset-password    → Body: { email, code, password, confirmPassword }
```

---

## 4. API Integration Patterns

### Standard Response Format

**Success:**
```json
{ "success": true, "message": "...", "data": { ... } }
```

**Paginated:**
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1, "limit": 20, "total": 150,
    "totalPages": 8, "hasNext": true, "hasPrev": false
  }
}
```

**Error:**
```json
{
  "success": false,
  "message": "...",
  "errorCode": "VALIDATION_ERROR",
  "details": [ { "field": "email", "message": "Invalid email" } ]
}
```

### Common Error Codes

| Code | Meaning | Action |
|------|---------|--------|
| `VALIDATION_ERROR` | Input invalid | Show field errors |
| `UNAUTHORIZED` | Bad credentials / expired token | Redirect to login |
| `FORBIDDEN` | Insufficient permissions | Show "access denied" |
| `NOT_FOUND` | Resource missing | Show 404 |
| `CONFLICT` | Duplicate (email/username) | Show "already exists" |
| `TOO_MANY_REQUESTS` | Rate limited | Show "try later" with timer |
| `PAYMENT_ERROR` | Payment failed | Show payment error UI |

---

## 5. Page-by-Page Implementation Guide

### 5.1 Home Page (`/`)

**Fetch movies:**
```
GET /movies/featured?limit=6
GET /movies/popular?limit=10
GET /movies/recent?limit=10
GET /movies/categories
```

**UI:**
- Hero section with featured movies (carousel)
- "Popular Movies" row (horizontal scroll)
- "Recently Added" row
- Category navigation pills

### 5.2 Movie Detail Page (`/movies/:slug`)

```
GET /movies/slug/:slug
```

**Display:**
- Cover image / poster
- Title, description, duration, release year
- Category, language, quality
- Price (formatted as `KES 20`)
- **Buy Now** button (if not owned)
- **Watch / Download** buttons (if owned)
- Trailer player (public access)

**Trailer URL (public):**
```
GET /stream/trailer/:slug
```
Use this directly in a `<video>` element or React Player with HTTP Range support.

### 5.3 Browse Movies (`/movies`)

```
GET /movies?page=1&limit=20&category=3&sort=popular&search=action
GET /movies/search?q=keyword&page=1&limit=20
```

**Filters:**
- Category dropdown (from `/movies/categories`)
- Sort: Newest, Popular, Price (Low-High), Price (High-Low)
- Search input with debounce (300ms)
- Grid view with posters

### 5.4 Registration (`/register`)

**Fields:**
- Username (3-30 chars, alphanumeric)
- Email (valid format)
- Phone (optional, Kenyan format: 0712345678)
- Password (min 8 chars, uppercase + lowercase + number + special char)
- Confirm password
- First/Last name (optional)

**Client-side validation** should match server validation rules.

### 5.5 Login (`/login`)

**Step 1 UI:** Single input for username + "Continue" button
**Step 2 UI:** Password input + "Sign In" button

### 5.6 Email Verification (`/verify-email`)

- Show message: "Check your email for the 6-digit code"
- 6 separate digit inputs (auto-advance on typing)
- "Resend code" button with 60s cooldown
- Email is auto-filled from registration

### 5.7 My Library (`/my-library`)

```
GET /movies/library/list?page=1&limit=20
```

**Display:**
- Grid of purchased movies with poster
- **Watch** button → opens player
- **Download** button
- Progress bar for partially watched movies
- "Continue Watching" section at top

### 5.8 Continue Watching

```
GET /movies/library/continue-watching?limit=10
```

Display cards with progress bar overlay.

### 5.9 Movie Player (`/watch/:movieId`)

```
GET /stream/movie/:movieId
```

**Implementation:**
```jsx
<video
  controls
  onTimeUpdate={handleTimeUpdate}
  onLoadedMetadata={handleLoadedMeta}
>
  <source src={`${API_URL}/stream/movie/${movie.id}`} type="video/mp4" />
</video>
```

**Save progress periodically:**
```
POST /movies/library/progress
Body: { movieId: 1, positionSeconds: 3600, durationSeconds: 7200, completed: false }
```

**Key points:**
- Use `{API_URL}/stream/movie/{id}` as the video source — the backend handles auth via the `Authorization` header
- The backend supports HTTP Range Requests, so seeking will work
- Save progress every 15 seconds and on page unload
- When `currentTime >= duration - 5 seconds`, mark as `completed: true`

### 5.10 Downloads Page

```
GET /stream/download/:id        → triggers browser download
GET /stream/signed-url/:id      → returns a temporary URL
```

**Options:**
1. Direct download: Open `/stream/download/:id` in a new tab
2. Signed URL: Fetch `/stream/signed-url/:id` and use the returned URL

### 5.11 Purchase Flow

```
POST /payments/purchase
Body: { "movieId": 1, "phoneNumber": "0712345678" }
```

**UI Flow:**
1. User clicks "Buy Now" on movie detail page
2. If NOT authenticated → redirect to `/login?redirect=/movies/{slug}`
3. If authenticated → show M-Pesa phone number input (pre-filled from profile if available)
4. User enters Safaricom number and clicks "Pay Now"
5. Show "STK Push sent. Check your phone to complete payment."
6. Show "Checking payment status..." with polling

**Polling for status:**
```
GET /payments/status/:checkoutRequestId
```

Poll every 3 seconds for up to 60 seconds. When status is `successful`, redirect to `/my-library`. If `failed`, show error.

### 5.12 Purchase History (`/purchases`)

```
GET /payments/history?page=1&limit=20
GET /payments/receipts
GET /payments/receipts/:id
```

Show order list with movie details, amount, date, receipt download link.

### 5.13 Support Tickets (`/support`)

```
POST /support          → create ticket
GET /support           → my tickets
GET /support/:id       → ticket with replies
POST /support/:id/reply → reply to ticket
```

---

## 6. Payment Flow (Detailed)

### User Experience:

1. **Movie Detail Page** → User clicks "Buy Now"
2. **Phone Number Input** → User enters Safaricom number
3. **STK Push** → User receives M-Pesa prompt on phone
4. **User enters PIN** on their phone
5. **Waiting Screen** → Frontend polls status
6. **Success** → Redirect to library with success toast
7. **Failure** → Show error message, option to retry

### Important:
- NEVER trust frontend for payment validation — the backend confirms via callback
- The callback URL is server-to-server (Safaricom → your backend)
- The frontend only needs to poll `GET /payments/status/:checkoutRequestId`

### Handling Interruptions:
- If user closes browser during payment → transaction remains in `processing` state
- When user returns, use `purchaseHistory` to check status
- Expired transactions are auto-cleaned by scheduled jobs

---

## 7. Streaming & Downloads

### Streaming Architecture:
```
Browser → Backend (auth check) → Cloudflare R2 → Backend (proxy) → Browser
```

The frontend NEVER knows the R2 URL. All streaming goes through the backend.

### Video Player Setup:

```jsx
import { useEffect, useRef } from 'react'
import axios from 'axios'

function MoviePlayer({ movieId }) {
  const videoRef = useRef(null)

  useEffect(() => {
    const saveProgress = () => {
      const video = videoRef.current
      if (!video?.currentTime) return
      axios.post('/movies/library/progress', {
        movieId,
        positionSeconds: Math.floor(video.currentTime),
        durationSeconds: Math.floor(video.duration || 0),
        completed: video.ended,
      })
    }

    const interval = setInterval(saveProgress, 15000)
    window.addEventListener('beforeunload', saveProgress)
    return () => {
      clearInterval(interval)
      saveProgress()
      window.removeEventListener('beforeunload', saveProgress)
    }
  }, [movieId])

  return (
    <video ref={videoRef} controls className="w-full" preload="metadata">
      <source src={`${import.meta.env.VITE_API_URL}/stream/movie/${movieId}`} type="video/mp4" />
    </video>
  )
}
```

### Resume Playback:
When loading a movie, check:
```
GET /stream/movie/:id
```
The backend handles Range headers for seeking.

### Downloads:

**Option A - Direct download:**
```html
<a href={`${API_URL}/stream/download/${movieId}`} download>
  Download
</a>
```

**Option B - Signed URL (recommended for large files):**
```javascript
const { data } = await axios.get(`/stream/signed-url/${movieId}`)
// data.data.url contains a temporary signed URL
window.open(data.data.url, '_blank')
```

---

## 8. Admin Dashboards

### Movie Owner Dashboard (`/admin/movies`)

```
GET /admin/movie-owner/dashboard
```

**Sections to build:**
- **Stats Cards**: Total Movies, Published, Draft, Hidden
- **Sales Cards**: Today, This Week, This Month, Lifetime Revenue
- **Customer Stats**: Total Customers, New This Month
- **Activity Cards**: Streams, Downloads
- **Top Selling Movies** table
- **Recent Purchases** table
- **Recent Activity** feed

**Movie Management:**
- Table of all movies (with search, filter by status)
- Create/Edit movie form
- Upload poster, trailer, movie file (multipart form)

### Developer Dashboard (`/admin/developer`)

```
GET /admin/developer/dashboard
```

**Additional sections:**
- User statistics (total, active, by role)
- Platform-wide revenue
- Commission breakdown
- Storage usage
- Error monitoring feed

### User Management (Developer only)

```
GET /admin/users?page=1&status=suspended&search=john
PUT /admin/users/:id/status   Body: { "status": "suspended" }
```

Table of users with status badges. Ability to search, filter, and change status.

### Support Tickets (Shared)

```
GET /admin/support/tickets?page=1&status=open&priority=high
PUT /admin/support/tickets/:id/status   Body: { "status": "resolved" }
POST /admin/support/tickets/:id/reply
```

---

## 9. Error Handling

### Axios Error Interceptor Pattern:

```javascript
client.interceptors.response.use(
  (res) => res,
  (error) => {
    const response = error.response?.data

    // Show toast for non-validation errors
    if (response?.errorCode !== 'VALIDATION_ERROR') {
      toast.error(response?.message || 'Something went wrong')
    }

    // Handle rate limiting
    if (response?.errorCode === 'TOO_MANY_REQUESTS') {
      toast.warning('Too many attempts. Please wait.')
    }

    return Promise.reject(error)
  }
)
```

### Form Validation:

Map server validation errors to form fields:
```javascript
if (error.response?.data?.errorCode === 'VALIDATION_ERROR') {
  const fieldErrors = {}
  error.response.data.details?.forEach((d) => {
    fieldErrors[d.field] = d.message
  })
  setErrors(fieldErrors)
}
```

---

## 10. Important Rules

### Security Rules (DO NOT VIOLATE)

1. **Never store raw R2 URLs** — always proxy through backend
2. **Never expose M-Pesa credentials** in frontend code
3. **Never trust frontend-only validation** — backend re-validates everything
4. **Tokens** live in `localStorage` — send via `Authorization: Bearer` header
5. **Logout** should clear all stored tokens
6. **Environment variables** for API URLs — never hardcode

### Business Rules

1. **Unverified users** can browse but cannot purchase or stream
2. **Users cannot buy the same movie twice** (backend returns `CONFLICT`)
3. **Free movies** are added to library immediately after clicking Buy
4. **Download is unlimited** for owned movies
5. **Receipts are permanent** — always stored and accessible
6. **Movie visibility** — only `published` movies appear in listings

### UI/UX Guidelines

1. **Loading states** — every API call needs a loading indicator
2. **Empty states** — "No movies found", "Your library is empty"
3. **Error states** — show friendly messages, not raw error codes
4. **Pagination** — implement infinite scroll or page numbers
5. **Mobile-first** — the platform will be used on phones for M-Pesa payments
6. **Skeleton loaders** — for movie cards and detail pages

### Route Protection

| Route | Auth Required | Role |
|-------|-------------|------|
| `/`, `/movies`, `/movies/:slug` | No | Any |
| `/my-library`, `/watch/:id` | Yes | Any verified user |
| `/purchases`, `/receipts`, `/support` | Yes | Any verified user |
| `/admin/movies`, `/admin/support` | Yes | movie_owner, developer |
| `/admin/developer`, `/admin/users` | Yes | developer only |

### Redirect After Login

If a user hits a protected route while unauthenticated:
1. Save the intended URL in query param: `/login?redirect=/movies/action-movie`
2. After login, redirect them back
3. If they were trying to buy a movie, redirect to the movie page

---

## API Endpoints Summary

### Public
```
GET  /api/health
GET  /api/movies
GET  /api/movies/:id
GET  /api/movies/slug/:slug
GET  /api/movies/popular
GET  /api/movies/recent
GET  /api/movies/featured
GET  /api/movies/search?q=
GET  /api/movies/categories
GET  /api/stream/trailer/:id
```

### Auth
```
POST /api/auth/register
POST /api/auth/login/step1
POST /api/auth/login/step2
POST /api/auth/verify-email
POST /api/auth/resend-verification
POST /api/auth/forgot-password
POST /api/auth/reset-password
POST /api/auth/refresh-token
```

### Auth (Protected)
```
POST /api/auth/change-password
POST /api/auth/logout
GET  /api/auth/profile
PUT  /api/auth/profile
```

### Movies (Protected - User)
```
GET  /api/movies/library/list
GET  /api/movies/library/continue-watching
POST /api/movies/library/progress
GET  /api/movies/library/downloads
GET  /api/movies/library/streams
```

### Streaming (Protected)
```
GET  /api/stream/movie/:id
GET  /api/stream/download/:id
GET  /api/stream/signed-url/:id
```

### Payments (Protected)
```
POST /api/payments/purchase
GET  /api/payments/status/:checkoutRequestId
GET  /api/payments/history
GET  /api/payments/orders/:id
GET  /api/payments/receipts
GET  /api/payments/receipts/:id
```

### Support (Protected)
```
POST /api/support
GET  /api/support
GET  /api/support/:id
POST /api/support/:id/reply
```

### Notifications (Protected)
```
GET  /api/notifications
GET  /api/notifications/unread-count
PUT  /api/notifications/:id/read
PUT  /api/notifications/read-all
```

### Movie Owner / Developer
```
GET  /api/admin/movie-owner/dashboard
POST /api/admin/movies/:id/poster       (multipart)
POST /api/admin/movies/:id/trailer      (multipart)
POST /api/admin/movies/:id/file         (multipart, large file)
POST /api/movies                        (create movie)
PUT  /api/movies/:id                    (update movie)
DELETE /api/movies/:id                  (delete movie)
POST /api/movies/categories            (create category)
PUT  /api/movies/categories/:id        (update category)
DELETE /api/movies/categories/:id      (delete category)
GET  /api/admin/support/tickets
PUT  /api/admin/support/tickets/:id/status
POST /api/admin/support/tickets/:id/reply
```

### Developer Only
```
GET  /api/admin/developer/dashboard
GET  /api/admin/developer/audit-logs
GET  /api/admin/developer/analytics
GET  /api/admin/developer/revenue-reports
GET  /api/admin/users
PUT  /api/admin/users/:id/status
```

See [API.md](./API.md) for full documentation of every endpoint including request/response examples.
