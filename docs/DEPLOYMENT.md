# Deployment Guide

## Prerequisites

- Node.js 18+
- MySQL 8+
- Cloudflare R2 bucket
- Safaricom M-Pesa credentials (production)
- SMTP server for emails

## Docker Deployment

```bash
# Clone and configure
git clone <repo>
cd DJ-Star-Original-Movies
cp backend/.env.example backend/.env
# Edit .env with production values

# Build and run
docker-compose up -d --build
```

## Manual Deployment

### 1. Database Setup
```bash
# Create database
mysql -u root -p -e "CREATE DATABASE dj_star_movies"

# Run migrations
cd backend
npx prisma migrate deploy

# Seed data
node database/prisma/seed.js
```

### 2. Backend Setup
```bash
cd backend
npm install --production
cp .env.example .env
# Configure all env vars
npm start
```

### 3. Environment Variables (.env)

All required variables are in `.env.example`. Key variables:
- `JWT_SECRET` - Generate with `openssl rand -hex 64`
- `DATABASE_URL` - MySQL connection string
- `R2_*` - Cloudflare R2 credentials
- `MPESA_*` - M-Pesa credentials

## Production Checklist

- [ ] JWT_SECRET is set to a strong random value
- [ ] NODE_ENV=production
- [ ] CORS_ORIGIN set to frontend domain
- [ ] Rate limiting configured appropriately
- [ ] SMTP credentials configured
- [ ] R2 bucket is configured and accessible
- [ ] M-Pesa credentials are for production environment
- [ ] SSL/TLS termination configured (reverse proxy)
- [ ] Logs are being collected and monitored
- [ ] Database backups configured
- [ ] Monitoring and alerting set up

## Reverse Proxy (Nginx)

```nginx
server {
    listen 443 ssl;
    server_name api.djstarmovies.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Large file streaming
        proxy_request_buffering off;
        proxy_buffering off;
        client_max_body_size 0;
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

## Monitoring

- Application logs: `logs/combined.log`, `logs/error.log`
- Payment logs: `logs/payments.log`
- Auth logs: `logs/auth.log`
- Health check: `GET /api/health`
