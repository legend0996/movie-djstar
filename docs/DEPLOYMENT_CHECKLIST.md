# DJ Star Original Movies - Production Deployment Checklist

Use this checklist before deploying to production. Every item must be verified.

## Database

- [ ] MySQL 8.0+ is installed and running
- [ ] Database `dj_star_movies` has been created
- [ ] Schema has been applied (`npm run migrate`)
- [ ] Seed data has been inserted (`npm run seed`)
- [ ] Database user has appropriate permissions (SELECT, INSERT, UPDATE, DELETE)
- [ ] Database connection pool is properly sized (DB_CONNECTION_LIMIT)
- [ ] Database backups are configured (daily at minimum)
- [ ] Slow query logging is enabled for performance monitoring

## Security

- [ ] `NODE_ENV` is set to `production`
- [ ] `JWT_SECRET` is a strong, unique random string (64+ characters)
- [ ] `BCRYPT_SALT_ROUNDS` is at least 12
- [ ] CORS origin is restricted to the frontend domain only
- [ ] Helmet middleware is active (all security headers enabled)
- [ ] Rate limiting is configured and active
- [ ] Input validation is working for all endpoints
- [ ] SQL injection protection is confirmed (parameterized queries)
- [ ] All passwords are hashed with bcrypt
- [ ] Sensitive data is never exposed in API responses
- [ ] `.env` file is in `.gitignore` and NOT committed
- [ ] No exposed stack traces in error responses
- [ ] File upload validation is active (type, size limits)
- [ ] Cloudflare R2 URLs are never exposed publicly

## Environment Variables

- [ ] All required variables in `.env` are configured
- [ ] Database credentials are correct
- [ ] JWT secret is set
- [ ] SMTP credentials are configured and tested
- [ ] Cloudflare R2 credentials are configured and tested
- [ ] M-Pesa credentials are configured (sandbox first, then production)
- [ ] Logging directory exists and is writable
- [ ] Upload temp directory exists and is writable

## Cloudflare R2

- [ ] R2 bucket has been created
- [ ] API tokens have been generated with read/write permissions
- [ ] R2 credentials are in `.env`
- [ ] Upload test: Upload a poster image successfully
- [ ] Stream test: Stream a movie trailer successfully
- [ ] Download test: Download a movie file successfully
- [ ] Public access is configured if needed (for posters)

## M-Pesa Buy Goods

- [ ] Buy Goods Till Number is active
- [ ] Consumer Key and Secret are correct
- [ ] Passkey is correct
- [ ] Callback URL is publicly accessible (HTTPS required)
- [ ] Timeout URL is publicly accessible
- [ ] Sandbox testing is complete before production
- [ ] Test payment flow end-to-end
- [ ] Verify callback handling is idempotent
- [ ] Test timeout handling
- [ ] Verify duplicate callback prevention

## Email Service

- [ ] SMTP server is reachable
- [ ] Email credentials are correct
- [ ] Test: Registration verification email is delivered
- [ ] Test: Password reset email is delivered
- [ ] Test: Purchase receipt email is delivered
- [ ] SPF/DKIM records are configured for the sending domain
- [ ] Send rate limits are respected

## Authentication

- [ ] User registration works end-to-end
- [ ] Email verification works with 6-digit code
- [ ] Login step 1 (username check) works
- [ ] Login step 2 (password) works
- [ ] JWT tokens are generated and verified
- [ ] Token expiration is working
- [ ] Refresh tokens work properly
- [ ] Password reset flow is complete
- [ ] Password change flow works
- [ ] Account lockout after failed attempts works
- [ ] Account status validation works (active, suspended, etc.)
- [ ] Role-based access control is enforced
- [ ] Logout invalidates sessions

## Movie Management

- [ ] Movie CRUD operations work
- [ ] Category management works
- [ ] Movie upload to R2 works
- [ ] Poster upload works
- [ ] Trailer upload works
- [ ] Movie listing with pagination works
- [ ] Movie search with fulltext index works
- [ ] Filtering by category works
- [ ] Sorting (newest, popular, price) works
- [ ] Featured movies display correctly
- [ ] Movie visibility (published/hidden/draft) is enforced

## Streaming

- [ ] Movie streaming starts immediately (low latency)
- [ ] HTTP Range Requests work (seeking)
- [ ] Trailer streaming works without authentication
- [ ] Full movie streaming requires authentication
- [ ] Full movie streaming requires ownership
- [ ] Buffering works for slow connections
- [ ] Multiple concurrent streams work

## Downloads

- [ ] Download requires authentication
- [ ] Download requires ownership
- [ ] Direct R2 URLs are never exposed
- [ ] Signed URLs expire correctly
- [ ] Large file downloads work
- [ ] Multiple downloads work

## Library & Purchases

- [ ] Movies are added to library after successful payment
- [ ] Duplicate purchase prevention works
- [ ] Continue watching tracks progress
- [ ] Playback position is saved correctly
- [ ] Library listing shows all owned movies
- [ ] Purchase history is accurate
- [ ] Receipts are generated and accessible
- [ ] Watch history is tracked

## Payments

- [ ] STK Push is sent to the correct phone number
- [ ] Callback is processed correctly
- [ ] Successful payment grants movie access
- [ ] Failed payment does NOT grant access
- [ ] Duplicate callbacks are handled idempotently
- [ ] Transaction history is complete
- [ ] Revenue records are accurate
- [ ] Receipts are generated for every successful purchase
- [ ] Commission split (40% developer) is calculated correctly

## Administration

- [ ] Movie Owner Dashboard loads with correct data
- [ ] Developer Dashboard loads with correct data
- [ ] User management works (list, search, update status)
- [ ] Audit logs are being recorded
- [ ] Support ticket management works
- [ ] Analytics data is accurate
- [ ] Revenue reports are accurate

## Monitoring & Logging

- [ ] Application logs are being written to `logs/`
- [ ] Error logs are separated from info logs
- [ ] Auth logs are captured
- [ ] Payment logs are captured
- [ ] Log rotation is configured
- [ ] Scheduled cleanup jobs are running
- [ ] Database connection pool is monitored

## Performance

- [ ] API response times are acceptable (< 200ms for standard queries)
- [ ] Database queries are optimized (no N+1 problems)
- [ ] Pagination is working on all list endpoints
- [ ] Rate limiting is preventing abuse
- [ ] Static files are compressed
- [ ] Response caching is considered where appropriate

## Deployment

- [ ] Process manager (PM2) is configured
- [ ] Server auto-restarts on crash
- [ ] Graceful shutdown is implemented
- [ ] Firewall allows only necessary ports (80, 443, 3306 from app server)
- [ ] SSL certificate is installed and auto-renewing
- [ ] Domains are configured with proper DNS records
- [ ] Monitoring is set up (uptime, CPU, memory, disk)
- [ ] Backup strategy is in place (database + R2)

## Final Verification

- [ ] Complete user flow: Register → Verify → Login → Browse → Search → Purchase → Stream → Download
- [ ] Admin flow: Login as Movie Owner → Upload movie → Set pricing → Publish
- [ ] Developer flow: Login as Developer → View dashboard → Generate reports → Manage users
- [ ] Error scenarios: Invalid login → Failed payment → Expired token → Rate limiting
- [ ] All API endpoints respond with correct status codes
- [ ] API documentation matches actual behavior
- [ ] Frontend team can consume all APIs successfully

---

## Post-Deployment

- [ ] Monitor logs for errors in the first 24 hours
- [ ] Verify payment callbacks are being processed
- [ ] Check email delivery rates
- [ ] Monitor database connection pool usage
- [ ] Review streaming performance
- [ ] Set up uptime monitoring (e.g., UptimeRobot, Pingdom)
- [ ] Configure alerts for critical errors

## Ready for Production? ✓
All checkboxes above must be verified before considering the platform production-ready.
