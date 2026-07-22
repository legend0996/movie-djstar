# DJ Star Original Movies - Backend Setup Guide

## Prerequisites

- **Node.js** v18 or higher
- **npm** v9 or higher
- **MySQL** 8.0 or higher
- **Cloudflare R2** account (for movie storage)
- **Safaricom M-Pesa** Buy Goods Till Number (for payments)
- **SMTP Server** credentials (for emails)

## Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd dj-star-original-movies
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your configuration values. See [Environment Variables Guide](#environment-variables) below.

### 3. Create Database

```bash
mysql -u root -p
CREATE DATABASE IF NOT EXISTS dj_star_movies CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

### 4. Run Migrations

```bash
npm run migrate
```

### 5. Seed Default Data

```bash
npm run seed
```

This creates three default accounts:
- **Developer**: `dev@djstarmovies.com` / `Admin@123456`
- **Movie Owner**: `owner@djstarmovies.com` / `Owner@123456`
- **Demo User**: `demo@djstarmovies.com` / `Demo@123456`

### 6. Start the Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

The API will be available at `http://localhost:5000/api`

## Environment Variables

See `.env.example` for the complete list of required environment variables.

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` or `production` |
| `PORT` | Server port | `5000` |
| `DB_HOST` | MySQL host | `localhost` |
| `DB_NAME` | Database name | `dj_star_movies` |
| `DB_USER` | MySQL user | `root` |
| `DB_PASSWORD` | MySQL password | |
| `JWT_SECRET` | JWT signing secret | A long random string |
| `SMTP_HOST` | SMTP server host | `smtp.gmail.com` |
| `SMTP_USER` | SMTP username | `your@gmail.com` |
| `SMTP_PASS` | SMTP password/app password | |
| `R2_ENDPOINT` | R2 endpoint URL | `https://<id>.r2.cloudflarestorage.com` |
| `R2_ACCESS_KEY_ID` | R2 access key | |
| `R2_SECRET_ACCESS_KEY` | R2 secret key | |
| `R2_BUCKET_NAME` | R2 bucket name | `dj-star-movies` |
| `MPESA_CONSUMER_KEY` | M-Pesa API consumer key | |
| `MPESA_CONSUMER_SECRET` | M-Pesa API secret | |
| `MPESA_PASSKEY` | M-Pesa passkey | |
| `MPESA_SHORTCODE` | Buy Goods Till Number | |
| `MPESA_ENVIRONMENT` | `sandbox` or `production` | |

## Production Deployment

### Shared Hosting (Node.js + MySQL)

1. Upload all files to your hosting environment
2. Run `npm install --production`
3. Configure `.env` with production values
4. Run `npm run migrate`
5. Run `npm run seed`
6. Set up a process manager (e.g., PM2):
   ```bash
   npm install -g pm2
   pm2 start src/server.js --name dj-star-movies
   pm2 save
   pm2 startup
   ```
7. Configure your web server (Apache/Nginx) to proxy requests to the Node.js port

### VPS/Dedicated Server

1. Follow the same steps as shared hosting
2. Set up Nginx as a reverse proxy:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_buffering off;
        proxy_request_buffering off;
        client_max_body_size 5000M;
    }
}
```

3. Set up SSL with Let's Encrypt:
   ```bash
   certbot --nginx -d yourdomain.com
   ```

## Project Structure

```
├── src/
│   ├── config/           # Configuration
│   ├── controllers/      # Request handlers
│   ├── jobs/             # Scheduled tasks
│   ├── middleware/        # Express middleware
│   ├── repositories/     # Data access layer
│   ├── routes/           # Route definitions
│   ├── services/         # Business logic
│   ├── templates/        # Email templates
│   ├── utils/            # Utilities
│   ├── validators/       # Input validation
│   ├── app.js            # Express application
│   └── server.js         # Entry point
├── database/
│   ├── schema.sql        # Database schema
│   ├── seed.sql          # Seed data
│   ├── migrate.js        # Migration script
│   └── seed.js           # Seed script
├── logs/                 # Application logs
├── docs/                 # Documentation
├── tests/                # Test files
├── .env.example          # Environment template
└── package.json
```

## Common Issues

### "ECONNREFUSED" on database
- Ensure MySQL is running
- Check `DB_HOST`, `DB_PORT` in `.env`
- Verify MySQL user has access from the Node.js server

### "File too large" errors
- Check `MAX_FILE_SIZE` in `.env` (default: 5GB)
- Ensure Nginx/Apache client_max_body_size is also increased

### "M-Pesa callback not received"
- Ensure `MPESA_CALLBACK_URL` is publicly accessible
- The URL must use HTTPS (Safaricom requirement)
- Test with ngrok for local development (must restart ngrok if connection drops):
  ```bash
  ngrok http 5000
  ```
  Then set `MPESA_CALLBACK_URL=https://your-ngrok.ngrok.io/api/payments/mpesa-callback`
- If callback was missed, transactions stay in `processing` state. Run `node scripts/fixStuckTransactions.js` to query M-Pesa and recover.
- **ResultCode arrives as a string** from Safaricom. The backend handles this with `Number()` conversion, but if modifying payment code, never compare with `=== 0` directly.

### "Email not sending"
- Verify SMTP credentials in `.env`
- Gmail users need an App Password (not regular password)
- Check that SMTP ports are not blocked by your hosting provider

## Testing

```bash
npm test
```
