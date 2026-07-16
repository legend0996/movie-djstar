# DJ Star Original Movies - API Documentation

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
- `user` - Regular customer
- `movie_owner` - Movie catalog administrator
- `developer` - Platform developer (full access)

---

## 1. Authentication Endpoints

### Health Check
```
GET /health
```
**Response**: `200 OK`
```json
{
  "success": true,
  "message": "DJ Star Original Movies API is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "development"
}
```

### Register
```
POST /auth/register
```
**Body**:
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
**Validation**: Username: alphanumeric, 3-30 chars. Email: valid format. Phone: Kenyan format. Password: 8+ chars, uppercase, lowercase, number, special char.
**Response**: `201 Created`
```json
{
  "success": true,
  "message": "Registration successful. Please check your email for verification code.",
  "data": { "userId": 1 }
}
```

### Login - Step 1 (Check Username)
```
POST /auth/login/step1
```
**Body**: `{"username": "johndoe"}`
**Response**: `200 OK`
```json
{
  "success": true,
  "data": { "exists": true, "status": "active" }
}
```

### Login - Step 2 (Password)
```
POST /auth/login/step2
```
**Body**: `{"username": "johndoe", "password": "StrongP@ss1"}`
**Response**: `200 OK`
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { "id": 1, "username": "johndoe", "email": "john@example.com", "role": "user", "status": "active" },
    "tokens": {
      "accessToken": "eyJhbGci...",
      "refreshToken": "eyJhbGci..."
    }
  }
}
```

### Verify Email
```
POST /auth/verify-email
```
**Body**: `{"email": "john@example.com", "code": "123456"}`
**Response**: `200 OK` - Returns tokens and user data

### Resend Verification Code
```
POST /auth/resend-verification
```
**Body**: `{"email": "john@example.com"}`

### Forgot Password
```
POST /auth/forgot-password
```
**Body**: `{"email": "john@example.com"}`

### Reset Password
```
POST /auth/reset-password
```
**Body**: `{"email": "john@example.com", "code": "123456", "password": "NewStr0ng@Pass", "confirmPassword": "NewStr0ng@Pass"}`

### Refresh Token
```
POST /auth/refresh-token
```
**Body**: `{"refreshToken": "eyJhbGci..."}`

### Change Password (Authenticated)
```
POST /auth/change-password
```
**Body**: `{"currentPassword": "OldP@ss1", "newPassword": "NewP@ss1", "confirmPassword": "NewP@ss1"}`

### Logout (Authenticated)
```
POST /auth/logout
```

### Get Profile (Authenticated)
```
GET /auth/profile
```

### Update Profile (Authenticated)
```
PUT /auth/profile
```
**Body**: `{"firstName": "John", "lastName": "Updated", "phone": "0712345678"}`

---

## 2. Movie Endpoints

### List Movies (Public)
```
GET /movies?page=1&limit=20&category=1&sort=newest&search=action&featured=true
```
**Query Parameters**:
- `page` (default: 1)
- `limit` (default: 20, max: 100)
- `category` - Category ID
- `search` - Search term
- `sort` - `newest`, `oldest`, `popular`, `price_asc`, `price_desc`, `title`
- `featured` - `true` to filter featured movies

### Get Movie by ID (Public)
```
GET /movies/:id
```

### Get Movie by Slug (Public)
```
GET /movies/slug/:slug
```

### Get Popular Movies (Public)
```
GET /movies/popular?limit=10
```

### Get Recent Movies (Public)
```
GET /movies/recent?limit=10
```

### Get Featured Movies (Public)
```
GET /movies/featured?limit=10
```

### Search Movies (Public)
```
GET /movies/search?q=action&category=action&page=1&limit=20
```

### Get Categories (Public)
```
GET /movies/categories?visible=true
```

### Create Movie (Movie Owner, Developer)
```
POST /movies
Authorization: Bearer <token>
```
**Body**:
```json
{
  "title": "My Movie",
  "description": "Full description",
  "categoryId": 1,
  "duration": 7200,
  "releaseYear": 2024,
  "language": "English",
  "quality": "HD",
  "price": 150.00,
  "status": "published"
}
```

### Update Movie (Movie Owner, Developer)
```
PUT /movies/:id
```

### Delete Movie (Movie Owner, Developer)
```
DELETE /movies/:id
```

### Create Category (Movie Owner, Developer)
```
POST /movies/categories
```
**Body**: `{"name": "Action", "description": "Action movies", "displayOrder": 3}`

### Update Category (Movie Owner, Developer)
```
PUT /movies/categories/:id
```

### Delete Category (Movie Owner, Developer)
```
DELETE /movies/categories/:id
```

### Reorder Categories (Movie Owner, Developer)
```
PUT /movies/categories/reorder
```
**Body**: `{"orders": [{"id": 1, "order": 1}, {"id": 2, "order": 2}]}`

---

## 3. Library Endpoints (Authenticated)

### Get My Library
```
GET /movies/library/list?page=1&limit=20
```

### Get Continue Watching
```
GET /movies/library/continue-watching?limit=10
```

### Save Playback Progress
```
POST /movies/library/progress
```
**Body**: `{"movieId": 1, "positionSeconds": 3600, "durationSeconds": 7200, "completed": false}`

### Get Download History
```
GET /movies/library/downloads?page=1&limit=20
```

### Get Stream History
```
GET /movies/library/streams?page=1&limit=20
```

---

## 4. Streaming & Download Endpoints

### Stream Trailer (Public)
```
GET /stream/trailer/:id
```
Returns video stream with HTTP Range Request support.

### Stream Movie (Authenticated, Must Own)
```
GET /stream/movie/:id
```
Returns video stream with HTTP Range Request support.

### Download Movie (Authenticated, Must Own)
```
GET /stream/download/:id
```
Returns the movie file as a download attachment.

### Get Signed Download URL (Authenticated, Must Own)
```
GET /stream/signed-url/:id
```
**Response**: `{"success": true, "data": {"url": "https://signed-url..."}}`

---

## 5. Payment Endpoints

### Initiate Purchase (Authenticated)
```
POST /payments/purchase
```
**Body**: `{"movieId": 1, "phoneNumber": "0712345678"}`
**Response**: `200 OK` - Sends STK Push to the user's phone.

### M-Pesa Callback (Safaricom only)
```
POST /payments/mpesa-callback
```
This endpoint is called by Safaricom. Not for frontend use.

### M-Pesa Timeout (Safaricom only)
```
POST /payments/mpesa-timeout
```
Not for frontend use.

### Query Payment Status (Authenticated)
```
GET /payments/status/:checkoutRequestId
```

### Get Purchase History (Authenticated)
```
GET /payments/history?page=1&limit=20
```

### Get Order Details (Authenticated)
```
GET /payments/orders/:id
```

### Get Receipts (Authenticated)
```
GET /payments/receipts?page=1&limit=20
```

### Get Receipt by ID (Authenticated)
```
GET /payments/receipts/:id
```

---

## 6. Support Endpoints (Authenticated)

### Create Support Ticket
```
POST /support
```
**Body**: `{"subject": "Cannot stream movie", "message": "I purchased movie X but it won't play.", "priority": "medium"}`

### Get My Tickets
```
GET /support?page=1&limit=20
```

### Get Ticket Details
```
GET /support/:id
```

### Reply to Ticket
```
POST /support/:id/reply
```
**Body**: `{"message": "I tried again and it works now"}`

---

## 7. Notification Endpoints (Authenticated)

### Get Notifications
```
GET /notifications?page=1&limit=20&unreadOnly=false
```

### Get Unread Count
```
GET /notifications/unread-count
```

### Mark Notification as Read
```
PUT /notifications/:id/read
```

### Mark All as Read
```
PUT /notifications/read-all
```

---

## 8. Admin Endpoints (Movie Owner, Developer)

### Movie Owner Dashboard
```
GET /admin/movie-owner/dashboard
Authorization: Bearer <token> (movie_owner or developer)
```

### Upload Poster (Movie Owner, Developer)
```
POST /admin/movies/:id/poster
Content-Type: multipart/form-data
Body: poster=<file>
```

### Upload Trailer (Movie Owner, Developer)
```
POST /admin/movies/:id/trailer
Content-Type: multipart/form-data
Body: trailer=<file>
```

### Upload Movie File (Movie Owner, Developer)
```
POST /admin/movies/:id/file
Content-Type: multipart/form-data
Body: movie=<file>
```

### Get Support Tickets (Movie Owner, Developer)
```
GET /admin/support/tickets?page=1&limit=20&status=open&priority=high
```

### Update Ticket Status (Movie Owner, Developer)
```
PUT /admin/support/tickets/:id/status
```
**Body**: `{"status": "resolved"}`

### Reply to Ticket as Staff (Movie Owner, Developer)
```
POST /admin/support/tickets/:id/reply
```
**Body**: `{"message": "We have resolved your issue."}`

---

## 9. Developer-Only Endpoints

### Developer Dashboard
```
GET /admin/developer/dashboard
Authorization: Bearer <token> (developer only)
```

### Audit Logs
```
GET /admin/developer/audit-logs?page=1&limit=50&action=login&userId=1
```

### Analytics
```
GET /admin/developer/analytics?startDate=2024-01-01&endDate=2024-01-31
```

### Revenue Reports
```
GET /admin/developer/revenue-reports?startDate=2024-01-01&endDate=2024-01-31
```

### User Management
```
GET /admin/users?page=1&limit=20&status=active&role=user&search=john
```

### Update User Status
```
PUT /admin/users/:id/status
```
**Body**: `{"status": "suspended"}`

---

## Standard Response Format

### Success
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Paginated
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
  "message": "Validation failed",
  "errorCode": "VALIDATION_ERROR",
  "details": [
    { "field": "email", "message": "Please provide a valid email address" }
  ]
}
```

## HTTP Status Codes
| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Validation Error |
| 429 | Too Many Requests |
| 500 | Internal Server Error |
