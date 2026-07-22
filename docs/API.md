# DJ Star Original Movies — API Documentation

## Base URL

```
Development: http://localhost:5000/api
Production: https://yourdomain.com/api
```

## Authentication

Most endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <access_token>
```

### Roles

| Role | Slug | Permissions |
|------|------|-------------|
| User | `user` | Browse, purchase, stream, download owned movies |
| Movie Owner | `movie_owner` | Manage movies, categories, uploads, support tickets |
| Developer | `developer` | Full access, user management, audit logs, revenue reports, analytics |

---

## Standard Response Formats

### Success
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Paginated List
```json
{
  "success": true,
  "message": "Success",
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Error
```json
{
  "success": false,
  "message": "Human-readable error message",
  "errorCode": "ERROR_CODE",
  "details": [
    { "field": "email", "message": "Please provide a valid email address" }
  ]
}
```

---

## HTTP Status Codes

| Code | Name | Description |
|------|------|-------------|
| 200 | OK | Successful request |
| 201 | Created | Resource created successfully |
| 202 | Accepted | Request accepted for processing |
| 204 | No Content | Successful, no response body |
| 400 | Bad Request | Invalid request format |
| 401 | Unauthorized | Authentication required or failed |
| 402 | Payment Required | Payment processing error |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists or constraint violation |
| 422 | Validation Error | Request body failed validation |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected server error |

---

## Rate Limiting Headers

All rate-limited endpoints return standard headers:

```
RateLimit-Limit: 100
RateLimit-Remaining: 95
RateLimit-Reset: 1704067200
```

| Header | Description |
|--------|-------------|
| `RateLimit-Limit` | Maximum requests allowed in the window |
| `RateLimit-Remaining` | Requests remaining in the current window |
| `RateLimit-Reset` | Unix timestamp when the window resets |

### Rate Limit Tiers

| Tier | Window | Max Requests | Applied To |
|------|--------|-------------|------------|
| General | 15 min | 100 | All endpoints |
| Auth | 15 min | 10 | `/auth/*` endpoints |
| Upload | 15 min | 5 | `/admin/movies/:id/*` uploads |
| Verification | 1 min | 3 | `/auth/verify-email`, `/auth/resend-verification`, `/auth/forgot-password` |

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 422 | Request body/query failed Joi validation |
| `UNAUTHORIZED` | 401 | Missing or invalid JWT token |
| `TOKEN_EXPIRED` | 401 | Access token has expired |
| `FORBIDDEN` | 403 | Insufficient role permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Duplicate resource or constraint violation |
| `INVALID_FILE_TYPE` | 400 | Uploaded file has disallowed MIME type |
| `FILE_TOO_LARGE` | 400 | Uploaded file exceeds size limit |
| `UPLOAD_ERROR` | 400 | Multer upload processing error |
| `INVALID_JSON` | 400 | Malformed JSON in request body |
| `TOO_MANY_REQUESTS` | 429 | Rate limit exceeded |
| `RATE_LIMITED` | 429 | Dedicated rate limit hit |
| `PAYMENT_ERROR` | 402 | M-Pesa payment processing failed |
| `INTERNAL_ERROR` | 500 | Unhandled server error |

---

## 1. Health

### GET /health
No authentication required.

**Response:**
```json
{
  "success": true,
  "message": "DJ Star Original Movies API is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "development"
}
```

---

## 2. Authentication (`/auth`)

### POST /auth/register
No authentication. Rate limited: 10/15min.

**Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "phone": "0712345678",
  "password": "StrongP@ss1",
  "confirmPassword": "StrongP@ss1",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Validation rules:**
- username: alphanumeric, 3-30 chars
- email: valid email format
- phone: Kenyan format (0712... or 254712...)
- password: 8+ chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
- confirmPassword: must match password

**Response (201):**
```json
{
  "success": true,
  "message": "Registration successful. Please check your email for verification code.",
  "data": { "userId": 1 }
}
```

---

### POST /auth/login/step1
No authentication. Rate limited: 10/15min.

**Body:** `{ "username": "johndoe" }`

**Response (200):**
```json
{
  "success": true,
  "data": { "exists": true, "status": "active" }
}
```

---

### POST /auth/login/step2
No authentication. Rate limited: 10/15min.

**Body:** `{ "username": "johndoe", "password": "StrongP@ss1" }`

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "username": "johndoe",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user",
      "status": "active"
    },
    "tokens": {
      "accessToken": "eyJhbGci...",
      "refreshToken": "eyJhbGci..."
    }
  }
}
```

---

### POST /auth/verify-email
No authentication. Rate limited: 3/min.

**Body:** `{ "email": "john@example.com", "code": "123456" }`

**Response (200):** Returns tokens and user data (same structure as login step2).

---

### POST /auth/resend-verification
No authentication. Rate limited: 3/min.

**Body:** `{ "email": "john@example.com" }`

**Response (200):** `{ "success": true, "message": "Verification code sent successfully." }`

---

### POST /auth/forgot-password
No authentication. Rate limited: 3/min.

**Body:** `{ "email": "john@example.com" }`

**Response (200):** Always returns success (does not reveal if email exists).

---

### POST /auth/reset-password
No authentication. Rate limited: 3/min.

**Body:**
```json
{
  "email": "john@example.com",
  "code": "123456",
  "password": "NewStr0ng@Pass",
  "confirmPassword": "NewStr0ng@Pass"
}
```

**Response (200):** `{ "success": true, "message": "Password reset successfully." }`

---

### POST /auth/refresh-token
No authentication. Not rate limited.

**Body:** `{ "refreshToken": "eyJhbGci..." }`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGci...",
    "refreshToken": "eyJhbGci..."
  }
}
```

---

### POST /auth/change-password
Authentication required.

**Body:**
```json
{
  "currentPassword": "OldP@ss1",
  "newPassword": "NewP@ss1",
  "confirmPassword": "NewP@ss1"
}
```

**Response (200):** `{ "success": true, "message": "Password changed successfully." }`

---

### POST /auth/logout
Authentication required.

**Response (200):** `{ "success": true, "message": "Logged out successfully." }`

---

### GET /auth/profile
Authentication required.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "phone": "254712345678",
    "firstName": "John",
    "lastName": "Doe",
    "avatarUrl": null,
    "role": "user",
    "roleName": "User",
    "status": "active",
    "emailVerifiedAt": "2024-01-01T00:00:00.000Z",
    "lastLoginAt": "2024-01-01T00:00:00.000Z",
    "libraryCount": 5,
    "totalPurchases": 5,
    "totalSpent": 100.00,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### PUT /auth/profile
Authentication required.

**Body:** `{ "firstName": "John", "lastName": "Updated", "phone": "0712345678" }`

**Response (200):** Returns updated profile object.

---

## 3. Movies (`/movies`)

### GET /movies/{id}
Public. Optional authentication (for library status).

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "My Movie",
    "slug": "my-movie",
    "description": "Full description...",
    "shortDescription": "Short desc",
    "categoryId": 1,
    "categoryName": "Action",
    "duration": 7200,
    "releaseYear": 2024,
    "language": "English",
    "quality": "HD",
    "ageRating": "PG-13",
    "director": "Director Name",
    "castMembers": ["Actor 1", "Actor 2"],
    "posterUrl": "https://pub-xxx.r2.dev/posters/uuid-poster.jpg",
    "trailerUrl": "movies/uuid-trailer.mp4",
    "price": 20.00,
    "isFree": false,
    "isFeatured": true,
    "status": "published",
    "totalViews": 1200,
    "totalPurchases": 85,
    "isOwned": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

Note: `isOwned` is only returned when authenticated.

---

### GET /movies/slug/{slug}
Public. Optional authentication. Same response as above.

---

### GET /movies
Public. Optional authentication. Paginated.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | int | 1 | Page number |
| limit | int | 20 | Items per page (max 100) |
| category | int | - | Filter by category ID |
| search | string | - | Search term (uses Prisma `contains`, LIKE-based) |
| sort | string | newest | `newest`, `oldest`, `popular`, `price_asc`, `price_desc`, `title` |
| featured | bool | - | Filter featured only |

**Response (200):** Paginated array of movie objects.

---

### GET /movies/popular
Public. Query: `?limit=10`

---

### GET /movies/recent
Public. Query: `?limit=10`

---

### GET /movies/featured
Public. Query: `?limit=10`

---

### GET /movies/search
Public. Paginated.

**Query Parameters:** `?q=action&category=1&page=1&limit=20`

---

### GET /movies/categories
Public. Query: `?visible=true`

**Response (200):**
```json
{
  "success": true,
  "data": [
    { "id": 1, "name": "Action", "slug": "action", "displayOrder": 1 }
  ]
}
```

---

### POST /movies
Authentication required. Roles: movie_owner, developer.

**Body:**
```json
{
  "title": "My Movie",
  "description": "Full description",
  "shortDescription": "Short desc",
  "categoryId": 1,
  "duration": 7200,
  "releaseYear": 2024,
  "language": "English",
  "quality": "HD",
  "ageRating": "PG-13",
  "director": "Director",
  "price": 20.00,
  "status": "published",
  "isFeatured": false
}
```

**Response (201):** Returns created movie object.

---

### PUT /movies/{id}
Authentication required. Roles: movie_owner, developer.

**Body:** Same as create (partial updates supported).

**Response (200):** Returns updated movie object.

---

### DELETE /movies/{id}
Authentication required. Roles: movie_owner, developer.

**Response (200):** `{ "success": true, "message": "Movie deleted successfully." }`

---

### POST /movies/categories
Authentication required. Roles: movie_owner, developer.

**Body:** `{ "name": "Action", "description": "Action movies", "displayOrder": 3 }`

---

### PUT /movies/categories/{id}
Authentication required. Roles: movie_owner, developer.

---

### DELETE /movies/categories/{id}
Authentication required. Roles: movie_owner, developer.

---

### PUT /movies/categories/reorder
Authentication required. Roles: movie_owner, developer.

**Body:** `{ "orders": [{ "id": 1, "order": 1 }, { "id": 2, "order": 2 }] }`

---

## 4. Library (`/movies/library`)

### GET /movies/library/list
Authentication required. Paginated.

### GET /movies/library/continue-watching
Authentication required. Query: `?limit=10`

### POST /movies/library/progress
Authentication required.

**Body:** `{ "movieId": 1, "positionSeconds": 3600, "durationSeconds": 7200, "completed": false }`

### GET /movies/library/downloads
Authentication required. Paginated.

### GET /movies/library/streams
Authentication required. Paginated.

---

## 5. Streaming (`/stream`)

### GET /stream/trailer/{id}
Public. HTTP Range Request support.

**Headers (request):** `Range: bytes=0-` (optional)

**Response (200/206):** Video stream (video/mp4).

**Response headers:**
```
Accept-Ranges: bytes
Content-Type: video/mp4
Content-Length: <size>
Content-Range: bytes <start>-<end>/<total>  (206 only)
Cache-Control: private, max-age=3600
```

---

### GET /stream/movie/{id}
Authentication required. Must own the movie. HTTP Range Request support.

Same response format as trailer but requires ownership verification.

---

### GET /stream/download/{id}
Authentication required. Must own the movie.

**Response headers:**
```
Content-Type: video/mp4
Content-Length: <size>
Content-Disposition: attachment; filename="my-movie.mp4"
Cache-Control: private, max-age=3600
```

---

### GET /stream/signed-url/{id}
Authentication required. Must own the movie.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "url": "https://<account>.r2.cloudflarestorage.com/...?X-Amz-Algorithm=..."
  }
}
```

---

## 6. Payments (`/payments`)

### POST /payments/purchase
Authentication required.

**Body:** `{ "movieId": 1, "phoneNumber": "0712345678" }`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "orderId": 1,
    "transactionId": 1,
    "orderNumber": "DJ-XXXX-XXXX",
    "amount": 20.00,
    "merchantRequestID": "abc-123",
    "checkoutRequestID": "ws_CO_0401202410000000",
    "responseDescription": "Success. Request accepted for processing",
    "message": "STK Push sent. Check your phone to complete payment."
  }
}
```

---

### POST /payments/mpesa-callback
Called by Safaricom only. No authentication.

Handles M-Pesa STK Push callback. Idempotent — duplicate callbacks are safely ignored.

---

### POST /payments/mpesa-timeout
Called by Safaricom only. No authentication.

Handles M-Pesa STK Push timeout.

---

### GET /payments/status/{checkoutRequestId}
Authentication required.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "status": "successful",
    "message": "Payment successful",
    "mpesaReceipt": "QWE1234567"
  }
}
```

---

### GET /payments/history
Authentication required. Paginated.

---

### GET /payments/orders/{id}
Authentication required.

**Response (200):** Order details with items, transaction, receipt.

---

### GET /payments/receipts
Authentication required. Paginated.

### GET /payments/receipts/{id}
Authentication required.

---

## 7. Support (`/support`)

### POST /support
Authentication required.

**Body:** `{ "subject": "Cannot stream movie", "message": "I purchased movie X but it won't play.", "priority": "medium" }`

### GET /support
Authentication required. Paginated.

### GET /support/{id}
Authentication required.

### POST /support/{id}/reply
Authentication required.

**Body:** `{ "message": "I tried again and it works now" }`

---

## 8. Notifications (`/notifications`)

### GET /notifications
Authentication required. Paginated.

**Query:** `?page=1&limit=20&unreadOnly=false`

### GET /notifications/unread-count
Authentication required.

**Response (200):** `{ "success": true, "data": { "count": 3 } }`

### PUT /notifications/{id}/read
Authentication required.

### PUT /notifications/read-all
Authentication required.

---

## 9. Admin — Movie Owner & Developer (`/admin`)

### GET /admin/movie-owner/dashboard
Authentication required. Roles: movie_owner, developer.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "movies": { "total": 50, "published": 40, "draft": 8, "hidden": 2 },
    "sales": { "today": 300, "week": 1400, "month": 6000, "lifetime": 80000 },
    "customers": { "total": 200, "newThisMonth": 25 },
    "streamsThisMonth": 1500,
    "downloadsThisMonth": 300,
    "topSelling": [...],
    "mostStreamed": [...],
    "recentPurchases": [...],
    "recentActivity": [...]
  }
}
```

---

### POST /admin/movies/{id}/poster
Authentication required. Roles: movie_owner, developer. Rate limited: 5/15min.

**Content-Type:** `multipart/form-data`
**Field:** `poster` — Image file (jpeg, png, webp, max 5MB)

---

### POST /admin/movies/{id}/trailer
Authentication required. Roles: movie_owner, developer. Rate limited: 5/15min.

**Content-Type:** `multipart/form-data`
**Field:** `trailer` — Video file (mp4, webm, max 100MB)

---

### POST /admin/movies/{id}/file
Authentication required. Roles: movie_owner, developer. Rate limited: 5/15min.

**Content-Type:** `multipart/form-data`
**Field:** `movie` — Video file (mp4, webm, mkv, max 5GB)

---

### GET /admin/support/tickets
Authentication required. Roles: movie_owner, developer. Paginated.

**Query:** `?page=1&limit=20&status=open&priority=high`

---

### PUT /admin/support/tickets/{id}/status
Authentication required. Roles: movie_owner, developer.

**Body:** `{ "status": "resolved" }`

---

### POST /admin/support/tickets/{id}/reply
Authentication required. Roles: movie_owner, developer.

**Body:** `{ "message": "We have resolved your issue." }`

---

## 10. Admin — Developer Only (`/admin/developer`)

### GET /admin/developer/dashboard
Authentication required. Role: developer only.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "users": {
      "total": 500, "active": 350, "unverified": 120, "suspended": 5,
      "byRole": [{ "name": "User", "slug": "user", "count": 470 }]
    },
    "movies": { "total": 50, "published": 40 },
    "orders": { "total": 1000, "paid": 800, "totalRevenue": 16000 },
    "commissions": { "developerCommission": 6400, "ownerEarnings": 9600, "commissionRate": 40 },
    "storage": { "fileCount": 60, "totalSizeBytes": 10737418240 },
    "activity": { "totalStreams": 5000, "totalDownloads": 1000, "newUsersToday": 10, "newOrdersToday": 5, "todayRevenue": 1000 },
    "recentErrors": [...]
  }
}
```

---

### GET /admin/developer/audit-logs
Authentication required. Role: developer only. Paginated.

**Query:** `?page=1&limit=50&action=login&userId=1&entityType=user&startDate=2024-01-01&endDate=2024-01-31`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "rows": [
      {
        "id": 1,
        "userId": 1,
        "username": "johndoe",
        "action": "login",
        "entityType": "user",
        "entityId": 1,
        "oldValues": null,
        "newValues": null,
        "ipAddress": "127.0.0.1",
        "userAgent": "Mozilla/...",
        "details": "...",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "total": 100
  }
}
```

---

### GET /admin/developer/analytics
Authentication required. Role: developer only.

**Query:** `?startDate=2024-01-01&endDate=2024-01-31`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "userGrowth": [{ "date": "2024-01-01", "count": 5 }, ...],
    "revenueTrend": [{ "date": "2024-01-01", "revenue": 200, "orders": 10 }, ...],
    "moviesByCategory": [{ "name": "Action", "slug": "action", "count": 15 }, ...],
    "purchaseTrend": [{ "date": "2024-01-01", "purchases": 8 }, ...],
    "period": { "start": "2024-01-01T00:00:00.000Z", "end": "2024-01-31T00:00:00.000Z" }
  }
}
```

---

### GET /admin/developer/revenue-reports
Authentication required. Role: developer only.

**Query:** `?startDate=2024-01-01&endDate=2024-01-31`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "daily": [{ "date": "2024-01-01", "revenue": 200, "transactions": 10 }, ...],
    "summary": { "totalOrders": 300, "totalRevenue": 6000, "avgOrderValue": 20 },
    "topMovies": [{ "title": "Movie A", "slug": "movie-a", "sales": 50, "revenue": 1000 }, ...],
    "period": { "start": "2024-01-01T00:00:00.000Z", "end": "2024-01-31T00:00:00.000Z" }
  }
}
```

---

### GET /admin/users
Authentication required. Role: developer only. Paginated.

**Query:** `?page=1&limit=20&status=active&role=user&search=john`

---

### PUT /admin/users/{id}/status
Authentication required. Role: developer only.

**Body:** `{ "status": "suspended" }`

Valid statuses: `active`, `unverified`, `suspended`, `disabled`

---

## 11. WebSocket Events (Future)

The platform will support WebSocket connections for real-time notifications.

### Connection
```
ws://localhost:5000/ws?token=<access_token>
```

### Event Types (Planned)

| Event | Direction | Description |
|-------|-----------|-------------|
| `notification` | Server → Client | New notification |
| `purchase_complete` | Server → Client | Purchase succeeded |
| `stream_start` | Client → Server | Begin streaming session |
| `stream_heartbeat` | Client → Server | Keep-alive during playback |
| `progress` | Client → Server | Playback position update |

---

## Pagination Format

All list endpoints returning multiple items use consistent pagination:

**Request parameters:**
- `page` (int, default: 1)
- `limit` (int, default: 20, max: 100)

**Response format:**
```json
{
  "success": true,
  "message": "Success",
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## Endpoint Summary

| Method | Path | Auth | Roles |
|--------|------|------|-------|
| GET | /api/health | - | - |
| POST | /api/auth/register | - | - |
| POST | /api/auth/login/step1 | - | - |
| POST | /api/auth/login/step2 | - | - |
| POST | /api/auth/verify-email | - | - |
| POST | /api/auth/resend-verification | - | - |
| POST | /api/auth/forgot-password | - | - |
| POST | /api/auth/reset-password | - | - |
| POST | /api/auth/refresh-token | - | - |
| POST | /api/auth/change-password | JWT | all |
| POST | /api/auth/logout | JWT | all |
| GET | /api/auth/profile | JWT | all |
| PUT | /api/auth/profile | JWT | all |
| GET | /api/movies | optional | - |
| GET | /api/movies/popular | - | - |
| GET | /api/movies/recent | - | - |
| GET | /api/movies/featured | - | - |
| GET | /api/movies/search | - | - |
| GET | /api/movies/categories | - | - |
| GET | /api/movies/slug/:slug | optional | - |
| GET | /api/movies/:id | optional | - |
| POST | /api/movies | JWT | mo, dev |
| PUT | /api/movies/:id | JWT | mo, dev |
| DELETE | /api/movies/:id | JWT | mo, dev |
| POST | /api/movies/categories | JWT | mo, dev |
| PUT | /api/movies/categories/:id | JWT | mo, dev |
| DELETE | /api/movies/categories/:id | JWT | mo, dev |
| PUT | /api/movies/categories/reorder | JWT | mo, dev |
| GET | /api/movies/library/list | JWT | all |
| GET | /api/movies/library/continue-watching | JWT | all |
| POST | /api/movies/library/progress | JWT | all |
| GET | /api/movies/library/downloads | JWT | all |
| GET | /api/movies/library/streams | JWT | all |
| GET | /api/stream/trailer/:id | - | - |
| GET | /api/stream/movie/:id | JWT | all |
| GET | /api/stream/download/:id | JWT | all |
| GET | /api/stream/signed-url/:id | JWT | all |
| POST | /api/payments/purchase | JWT | all |
| POST | /api/payments/mpesa-callback | - | - |
| POST | /api/payments/mpesa-timeout | - | - |
| GET | /api/payments/status/:id | JWT | all |
| GET | /api/payments/history | JWT | all |
| GET | /api/payments/orders/:id | JWT | all |
| GET | /api/payments/receipts | JWT | all |
| GET | /api/payments/receipts/:id | JWT | all |
| POST | /api/support | JWT | all |
| GET | /api/support | JWT | all |
| GET | /api/support/:id | JWT | all |
| POST | /api/support/:id/reply | JWT | all |
| GET | /api/notifications | JWT | all |
| GET | /api/notifications/unread-count | JWT | all |
| PUT | /api/notifications/:id/read | JWT | all |
| PUT | /api/notifications/read-all | JWT | all |
| GET | /api/admin/movie-owner/dashboard | JWT | mo, dev |
| POST | /api/admin/movies/:id/poster | JWT | mo, dev |
| POST | /api/admin/movies/:id/trailer | JWT | mo, dev |
| POST | /api/admin/movies/:id/file | JWT | mo, dev |
| GET | /api/admin/support/tickets | JWT | mo, dev |
| PUT | /api/admin/support/tickets/:id/status | JWT | mo, dev |
| POST | /api/admin/support/tickets/:id/reply | JWT | mo, dev |
| GET | /api/admin/developer/dashboard | JWT | dev |
| GET | /api/admin/developer/audit-logs | JWT | dev |
| GET | /api/admin/developer/analytics | JWT | dev |
| GET | /api/admin/developer/revenue-reports | JWT | dev |
| GET | /api/admin/users | JWT | dev |
| PUT | /api/admin/users/:id/status | JWT | dev |

*Roles: mo = movie_owner, dev = developer, all = any authenticated user*
