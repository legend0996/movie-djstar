# Security Architecture

## Authentication

- **JWT Access Tokens**: Short-lived (24h default), signed with HS256
- **JWT Refresh Tokens**: Long-lived (7d), stored in user_sessions table
- **Token Rotation**: Refresh tokens are rotated on each use
- **Session Revocation**: Logout or password change revokes all sessions
- **Password Policy**: 8+ chars, uppercase, lowercase, number, special char
- **Account Lockout**: 5 failed attempts → 30-min lockout

## Authorization (RBAC)

Three roles with hierarchical permissions:
- **user**: Browse, purchase, stream, support tickets
- **movie_owner**: CRUD movies, upload media, view sales dashboard
- **developer**: Full access, user management, platform analytics, audit logs

## HTTP Security Headers

- Helmet middleware (default protections)
- `X-XSS-Protection: 1; mode=block`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `Strict-Transport-Security` (production only)

## Input Validation

- **Joi schemas** on all endpoints
- **Sanitization**: HTML stripping, null byte removal
- **Type coercion**: All inputs validated and coerced
- **Never trust client**: Server-side validation for everything

## Rate Limiting

| Limiter | Window | Max Requests |
|---------|--------|-------------|
| General | 15 min | 100 |
| Auth | 15 min | 10 |
| Upload | 15 min | 5 |
| Verification | 1 min | 3 |

## File Upload Security

- MIME type whitelist (images: jpeg/png/webp, video: mp4/webm)
- Size limits (posters: 5MB, trailers: 100MB, movies: 5GB configurable)
- Memory storage (no temp files on disk)
- File type validation before processing

## Database Security

- **Prisma ORM**: Parameterized queries prevent SQL injection
- **Input sanitization**: All string inputs sanitized
- **Soft deletes**: No permanent data loss
- **Audit logging**: All critical actions logged

## M-Pesa Security

- Callback verification with structured body validation
- Idempotency handling (prevent duplicate processing)
- Transaction reference tracking
- Payment logging separate from app logs

## Sensitive Data

- Passwords: bcrypt (12 salt rounds)
- JWT secrets: Environment variable (required)
- R2 credentials: Environment variables
- M-Pesa credentials: Environment variables
- No secrets in code or logs
- No stack traces in production error responses
