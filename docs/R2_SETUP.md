# Cloudflare R2 Setup Guide

## Overview

Cloudflare R2 is the primary storage system for DJ Star Original Movies. All movie files, posters, trailers, and thumbnails are stored in R2 buckets. The backend uses the S3-compatible API to interact with R2.

### Why R2?
- **S3-compatible API** — uses standard AWS SDK
- **Zero egress fees** — cost-effective for streaming
- **Global distribution** — served from Cloudflare's edge network
- **No separate CDN needed** — integrated with Cloudflare's network

---

## Step 1: Create an R2 Bucket

1. Log in to your [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **R2** in the left sidebar
3. Click **Create Bucket**
4. Enter a bucket name (e.g., `dj-star-movies`)
5. Choose a location (optional, defaults to automatic)
6. Click **Create Bucket**

---

## Step 2: Generate API Tokens

1. In the R2 dashboard, go to **Manage R2 API Tokens**
2. Click **Create API Token**
3. Choose **Admin Read & Write** permission
4. Specify the bucket you created (or leave blank for all buckets)
5. Click **Create**
6. **IMPORTANT:** Save the following values immediately (they won't be shown again):
   - Access Key ID
   - Secret Access Key

---

## Step 3: Configure Bucket Policies

### Default Permissions
By default, R2 buckets are private. All access goes through the backend proxy.

### Public Access (for posters/thumbnails)
If you want posters and thumbnails to be served directly via CDN:

1. Go to your bucket's settings
2. Navigate to **Settings** → **Public Access**
3. Click **Connect Domain** to use a custom domain
4. Or use the provided `r2.dev` subdomain
5. The public URL will look like: `https://pub-<hash>.r2.dev`

### Bucket Policy Example
```json
{
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": "*",
      "Action": ["s3:GetObject"],
      "Resource": ["bucket-name/posters/*", "bucket-name/thumbnails/*"]
    }
  ]
}
```

---

## Step 4: CORS Configuration

Configure CORS on your R2 bucket to allow cross-origin requests from your frontend:

```json
[
  {
    "AllowedOrigins": ["https://your-frontend-domain.com"],
    "AllowedMethods": ["GET"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

To configure via the Cloudflare dashboard:
1. Navigate to your bucket
2. Go to **Settings** → **CORS Policy**
3. Paste the JSON configuration
4. Click **Save**

---

## Step 5: Public URL Setup

### Option A: r2.dev Subdomain (Quick)
```
R2_PUBLIC_URL=https://pub-<hash>.r2.dev
```

### Option B: Custom Domain (Recommended)
1. Go to your bucket's settings
2. Click **Connect Domain**
3. Enter your custom domain (e.g., `cdn.yourdomain.com`)
4. Add the CNAME record to your DNS as instructed
5. Wait for SSL certificate provisioning (up to 30 seconds)
6. Update your `.env`:
```
R2_PUBLIC_URL=https://cdn.yourdomain.com
```

---

## Step 6: Integration with Backend

### Environment Configuration

```env
R2_ENDPOINT=https://<accountid>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_BUCKET_NAME=dj-star-movies
R2_PUBLIC_URL=https://pub-<hash>.r2.dev
R2_REGION=auto
```

### Where to find each value:

| Variable | Where to Find |
|----------|---------------|
| `R2_ENDPOINT` | `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` — Account ID in Cloudflare dashboard URL |
| `R2_ACCESS_KEY_ID` | From the API token created in Step 2 |
| `R2_SECRET_ACCESS_KEY` | From the API token created in Step 2 |
| `R2_BUCKET_NAME` | The name you chose for your bucket |
| `R2_PUBLIC_URL` | Your bucket's public URL (r2.dev subdomain or custom domain) |
| `R2_REGION` | Always `auto` for R2 |

### Integration Points

The backend integrates with R2 via `services/r2Service.js` using the AWS SDK S3 client:

```javascript
const { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');

const s3Client = new S3Client({
  region: 'auto',
  endpoint: config.r2.endpoint,
  credentials: {
    accessKeyId: config.r2.accessKeyId,
    secretAccessKey: config.r2.secretAccessKey,
  },
  forcePathStyle: true,
});
```

---

## Step 7: Testing Uploads

### Via API (Authenticated as movie_owner or developer)

```bash
# Upload a poster
curl -X POST https://yourdomain.com/api/admin/movies/1/poster \
  -H "Authorization: Bearer <token>" \
  -F "poster=@/path/to/poster.jpg"

# Upload a trailer
curl -X POST https://yourdomain.com/api/admin/movies/1/trailer \
  -H "Authorization: Bearer <token>" \
  -F "trailer=@/path/to/trailer.mp4"

# Upload a movie file
curl -X POST https://yourdomain.com/api/admin/movies/1/file \
  -H "Authorization: Bearer <token>" \
  -F "movie=@/path/to/movie.mp4"
```

### Using AWS CLI (Direct R2 access)

```bash
# Install AWS CLI and configure with R2 credentials
aws configure
# AWS Access Key ID: <R2_ACCESS_KEY_ID>
# AWS Secret Access Key: <R2_SECRET_ACCESS_KEY>
# Default region: auto

# List objects
aws s3 --endpoint-url https://<accountid>.r2.cloudflarestorage.com ls s3://dj-star-movies/

# Upload test file
aws s3 --endpoint-url https://<accountid>.r2.cloudflarestorage.com \
  cp test.jpg s3://dj-star-movies/posters/test.jpg

# Download test file
aws s3 --endpoint-url https://<accountid>.r2.cloudflarestorage.com \
  cp s3://dj-star-movies/posters/test.jpg ./downloaded.jpg
```

---

## Step 8: Upload Process Flow

```
Admin uploads file
     │
     ▼
Multer receives file in memory (buffer)
     │
     ▼
r2Service.uploadFile(buffer, filename, mimeType)
     │
     ├── Generate UUID prefix
     ├── Key: {folder}/{uuid}-{filename}
     │
     ▼
PutObjectCommand to R2
     │
     ▼
File stored at: movies/uuid-filename.mp4
     │
     ▼
Store key in database:
  movie.movie_url = "movies/uuid-filename.mp4"
  movie.movie_size = <file size>
  movie.movie_format = "mp4"
```

---

## Folder Structure in R2

```
dj-star-movies/
├── movies/          # Full movie files (mp4, webm, mkv)
│   ├── uuid1-movie1.mp4
│   └── uuid2-movie2.mp4
├── posters/         # Movie poster images
│   ├── uuid3-poster1.jpg
│   └── uuid4-poster2.jpg
├── trailers/        # Movie trailer videos
│   ├── uuid5-trailer1.mp4
│   └── uuid6-trailer2.mp4
└── thumbnails/      # Movie thumbnail images (future use)
```

---

## Security Recommendations

1. **Never expose R2 credentials** — They should only exist in your `.env` file
2. **Never expose raw R2 URLs** — All access must go through backend authorization
3. **Use signed URLs for temporary access** — The signed URL endpoint generates temporary URLs that expire in 1 hour
4. **Restrict bucket access** — Use IAM-style policies to restrict which API tokens can access the bucket
5. **Enable Object Lock** (optional) — To prevent accidental deletion of movie files
6. **Monitor usage** — Set up R2 usage alerts to monitor storage costs

---

## Cost Considerations

| Factor | R2 | AWS S3 |
|--------|-----|---------|
| Storage | $0.015/GB/month | $0.023/GB/month |
| Egress | $0.00/GB | $0.09/GB |
| Class A ops (write) | $4.50/million | $5.00/million |
| Class B ops (read) | $0.36/million | $0.40/million |

For a streaming platform, the **zero egress fees** make R2 significantly more cost-effective than S3.

---

## Troubleshooting

### "Failed to upload file to storage"
- Verify your R2 credentials in `.env`
- Ensure the bucket name is correct
- Check that your API token has write permissions
- Verify network connectivity to `r2.cloudflarestorage.com`

### "Failed to stream file from storage"
- Verify the file exists in R2
- Check that the movie record has the correct `movie_url` stored
- Ensure the API token has read permissions

### "Access Denied" errors
- Verify API token permissions (Admin Read & Write)
- Check token is not expired
- Ensure bucket policy allows the operation

### Slow uploads/downloads
- R2 is globally distributed; performance depends on your location
- For large files (>100MB), consider using multipart upload
- The backend stores files in memory before uploading — for very large files (>500MB), use streaming uploads directly to R2
