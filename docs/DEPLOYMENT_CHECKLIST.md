# DJ Star Original Movies — Production Deployment Checklist

Use this checklist before deploying to production. Every item must be verified.

---

## Environment Configuration

- [ ] `NODE_ENV` is set to `production`
- [ ] All 15 required environment variables are configured in `.env`
- [ ] `APP_URL` is set to the production URL
- [ ] `PORT` is set to `5000` (or as needed)
- [ ] `CORS_ORIGIN` is set to the frontend domain (not `*`)
- [ ] `.env` file is in `.gitignore` and NOT committed to version control

## JWT Secrets

- [ ] `JWT_SECRET` changed to a strong random value (64+ characters)
- [ ] `JWT_EXPIRES_IN` is set (recommended: `24h`)
- [ ] `JWT_REFRESH_EXPIRES_IN` is set (recommended: `7d`)

## Database

- [ ] MySQL 8.0+ is installed and running
- [ ] Database `dj_star_movies` has been created
- [ ] Schema has been applied (`npx prisma migrate deploy`)
- [ ] Seed data has been inserted (`npm run seed`)
- [ ] Database user has appropriate permissions (SELECT, INSERT, UPDATE, DELETE)
- [ ] Database connection pool is properly sized (`DB_CONNECTION_LIMIT=10-20`)
- [ ] Database backups are configured (daily at minimum)
- [ ] Slow query logging is enabled for performance monitoring

## Cloudflare R2

- [ ] R2 bucket has been created
- [ ] API tokens have been generated with Admin Read & Write permissions
- [ ] R2 credentials are configured in `.env`
- [ ] CORS policy is configured on the R2 bucket
- [ ] Upload test: Upload a poster image successfully
- [ ] Stream test: Stream a movie trailer successfully
- [ ] Download test: Download a movie file successfully
- [ ] Public access is configured if needed (for posters/thumbnails)

## M-Pesa Integration

- [ ] M-Pesa Buy Goods Till Number is active
- [ ] Production Consumer Key and Secret obtained from Safaricom
- [ ] Production Passkey obtained from Safaricom
- [ ] `MPESA_ENVIRONMENT` is set to `production`
- [ ] Callback URL is publicly accessible (HTTPS required)
- [ ] Timeout URL is publicly accessible (HTTPS required)
- [ ] Sandbox end-to-end testing completed before production switch
- [ ] Test payment flow end-to-end with real transaction
- [ ] Verify callback handling is idempotent
- [ ] Verify timeout handling works
- [ ] Receipts are generated for every successful purchase

## SMTP / Email

- [ ] SMTP server is configured and reachable
- [ ] SMTP credentials are correct
- [ ] `EMAIL_FROM` is a valid, verified sender address
- [ ] Test: Registration verification email is delivered
- [ ] Test: Password reset email is delivered
- [ ] Test: Purchase receipt email is delivered
- [ ] SPF/DKIM records are configured for the sending domain
- [ ] Send rate limits are respected

## Security

- [ ] `BCRYPT_SALT_ROUNDS` is at least 12
- [ ] CORS origin is restricted to the frontend domain only
- [ ] Helmet middleware is active (all security headers enabled)
- [ ] Rate limiting is configured and active
- [ ] Input validation is working for all endpoints (Joi)
- [ ] SQL injection protection is confirmed (parameterized queries)
- [ ] All passwords are hashed with bcrypt
- [ ] Sensitive data is never exposed in API responses
- [ ] No exposed stack traces in error responses (`NODE_ENV=production`)
- [ ] File upload validation is active (MIME type + size limits)
- [ ] Cloudflare R2 URLs are never exposed directly to clients
- [ ] Maximum login attempts configured (recommended: 5)
- [ ] Account lockout duration configured (recommended: 30 minutes)

## SSL/TLS

- [ ] SSL certificates are installed (Let's Encrypt via Certbot)
- [ ] Auto-renewal is configured and verified
- [ ] HTTP → HTTPS redirect is working
- [ ] HSTS header is set (`max-age=31536000; includeSubDomains`)

## Web Server (Nginx)

- [ ] Nginx is installed and configured as reverse proxy
- [ ] `client_max_body_size` is set to at least 5000M (for movie uploads)
- [ ] `proxy_read_timeout` is set to 86400s (for streaming)
- [ ] `proxy_buffering` is off (for streaming)
- [ ] Gzip compression is enabled
- [ ] Rate limiting at Nginx level is configured (optional but recommended)

## CORS

- [ ] `CORS_ORIGIN` in `.env` matches the frontend URL exactly
- [ ] R2 bucket CORS policy allows cross-origin requests from frontend

## Rate Limiting

- [ ] General rate limit is configured (recommended: 100 requests/15 minutes)
- [ ] Auth rate limit is configured (recommended: 10 requests/15 minutes)
- [ ] Upload rate limit is configured (recommended: 5 requests/15 minutes)
- [ ] Verification rate limit is configured (recommended: 3 requests/1 minute)
- [ ] Rate limiting headers are verified in responses

## File Upload

- [ ] `MAX_FILE_SIZE` is configured (recommended: 5242880000 = 5GB)
- [ ] `UPLOAD_TEMP_DIR` exists and is writable
- [ ] MIME type validation is working for posters, trailers, and movies
- [ ] Upload temp directory cleanup is enabled (scheduled job)

## Monitoring

- [ ] Health check endpoint is accessible (`GET /api/health`)
- [ ] Application logs are being written to `logs/`
- [ ] Error logs are separated from info logs
- [ ] Auth logs are captured separately
- [ ] Payment logs are captured separately
- [ ] Log rotation is configured (via logrotate or winston)
- [ ] PM2 or similar process manager is configured (auto-restart on crash)
- [ ] Server uptime monitoring is set up (e.g., UptimeRobot, Pingdom)
- [ ] Alerts are configured for critical errors

## Backup

- [ ] Database backup schedule is configured (daily at minimum)
- [ ] Backup retention policy is set (30 days recommended)
- [ ] R2 backup strategy is in place (rclone or similar)
- [ ] Backup restoration has been tested
- [ ] `.env` file backup is stored in a secrets manager

## Process Management

- [ ] PM2 is installed and configured
- [ ] Application auto-restarts on crash (`--watch` or systemd)
- [ ] Max restart limit is configured (recommended: 10)
- [ ] Graceful shutdown is implemented (SIGTERM/SIGINT handlers)
- [ ] Database connection pool drains on shutdown

## Performance

- [ ] API response times are acceptable (< 200ms for standard queries)
- [ ] Database queries are optimized (no N+1 problems)
- [ ] Pagination is working on all list endpoints
- [ ] Rate limiting is preventing abuse
- [ ] Static files are compressed (via Nginx or compression middleware)
- [ ] Full-text search index is active on movies table
- [ ] Database connection pool is adequately sized

## Authentication Flow

- [ ] User registration works end-to-end
- [ ] Email verification works with 6-digit code
- [ ] Login step 1 (username check) works
- [ ] Login step 2 (password) works
- [ ] JWT tokens are generated and verified
- [ ] Token expiration is working (24h access, 7d refresh)
- [ ] Refresh tokens work properly (rotation)
- [ ] Password reset flow is complete
- [ ] Password change flow works
- [ ] Account lockout after 5 failed attempts works
- [ ] Account status validation works (active, suspended, disabled, deleted)
- [ ] Role-based access control is enforced for all endpoints
- [ ] Logout invalidates sessions

## Movie Management

- [ ] Movie CRUD operations work
- [ ] Category management works (create, update, delete, reorder)
- [ ] Movie upload to R2 works (poster, trailer, file)
- [ ] Movie listing with pagination works
- [ ] Movie search with full-text index works
- [ ] Filtering by category works
- [ ] Sorting (newest, popular, price) works
- [ ] Featured movies display correctly
- [ ] Movie visibility (published/hidden/draft) is enforced

## Streaming

- [ ] Trailer streaming works without authentication
- [ ] Movie streaming requires authentication
- [ ] Movie streaming requires ownership verification
- [ ] HTTP Range Requests work (seeking, buffering, resume)
- [ ] 206 Partial Content is returned for Range requests
- [ ] Multiple concurrent streams work
- [ ] Streaming is logged to stream_log

## Downloads

- [ ] Download requires authentication and ownership
- [ ] Direct R2 URLs are never exposed
- [ ] Signed URLs expire correctly (1 hour)
- [ ] Signed URL generation requires ownership verification
- [ ] Downloads are logged to download_log

## Library

- [ ] Movies are added to library after successful payment
- [ ] Duplicate purchase prevention works
- [ ] Continue watching tracks playback progress
- [ ] Playback position is saved correctly
- [ ] Library listing shows all owned movies
- [ ] Purchase history is accurate
- [ ] Watch history (stream/download) is tracked

## Payments

- [ ] STK Push is sent to the correct phone number
- [ ] Callback is processed correctly
- [ ] Successful payment grants movie access (library + download)
- [ ] Failed payment does NOT grant access
- [ ] Duplicate callbacks are handled idempotently
- [ ] Transaction history is complete for all payment states
- [ ] Revenue records are accurate (40% developer commission)
- [ ] Receipts are generated for every successful purchase
- [ ] Receipt emails are sent

## Administration

- [ ] Movie Owner Dashboard loads with correct data
- [ ] Developer Dashboard loads with correct data
- [ ] User management works (list, search, update status)
- [ ] Audit logs are being recorded for admin actions
- [ ] Support ticket management works (list, update, reply)
- [ ] Analytics data is accurate
- [ ] Revenue reports are accurate

## Scheduled Jobs

- [ ] Cleanup schedule is configured (default: every 6 hours)
- [ ] Expired verification codes are cleaned
- [ ] Expired sessions are cleaned
- [ ] Expired payment transactions are cancelled
- [ ] Temporary upload files are cleaned
- [ ] Daily analytics aggregation runs (at 2:00 AM)
- [ ] Platform statistics are being recorded daily

## Final End-to-End Verification

- [ ] Complete user flow: Register → Verify Email → Login → Browse → Search → Purchase (STK Push) → Stream → Download
- [ ] Admin flow: Login as Movie Owner → Create Movie → Upload Poster → Upload Trailer → Upload File → Publish → View Dashboard
- [ ] Developer flow: Login as Developer → View Dashboard → Generate Reports → Manage Users → View Audit Logs
- [ ] Error scenarios: Invalid login → Failed payment → Expired token → Rate limiting → 404 on missing movie
- [ ] All API endpoints respond with correct status codes
- [ ] API documentation matches actual endpoint behavior
- [ ] All security headers are present in responses

---

## Post-Deployment Monitoring (First 24 Hours)

- [ ] Monitor logs for errors and warnings
- [ ] Verify payment callbacks are being processed successfully
- [ ] Check email delivery rates (bounces, failures)
- [ ] Monitor database connection pool usage
- [ ] Review streaming performance (latency, buffering)
- [ ] Check disk space (logs, database, uploads)
- [ ] Verify backup job completed successfully
- [ ] Test the complete user flow one more time against production

---

## Ready for Production?

All checkboxes above must be verified before considering the platform production-ready.
