# Cloudflare R2 Integration Guide

## Overview
Cloudflare R2 is the primary storage system for DJ Star Original Movies. All movie files, posters, trailers, and thumbnails are stored in R2 buckets. The backend uses the S3-compatible API to interact with R2.

## Prerequisites
- A Cloudflare account with R2 enabled
- A Cloudflare R2 bucket created for movie storage

## Step 1: Create an R2 Bucket

1. Log in to your [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **R2** in the left sidebar
3. Click **Create Bucket**
4. Enter a bucket name (e.g., `dj-star-movies`)
5. Choose a location (optional, defaults to automatic)
6. Click **Create Bucket**

## Step 2: Generate API Tokens

1. In the R2 dashboard, go to **Manage R2 API Tokens**
2. Click **Create API Token**
3. Choose **Admin Read & Write** permission
4. Specify the bucket you created (or leave blank for all buckets)
5. Click **Create**
6. **IMPORTANT**: Save the following values immediately (they won't be shown again):
   - Access Key ID
   - Secret Access Key

## Step 3: Configure Bucket Permissions (Optional)

For public access to posters and thumbnails:

1. Go to your bucket's settings
2. Navigate to **Settings** → **Public Access**
3. Click **Connect Domain** to use a custom domain or use the provided `r2.dev` subdomain
4. The public URL will look like: `https://pub-<hash>.r2.dev`

## Step 4: Configure Environment Variables

Add the following to your `.env` file:

```env
# Cloudflare R2 Configuration
R2_ENDPOINT=https://<accountid>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your_access_key_id_here
R2_SECRET_ACCESS_KEY=your_secret_access_key_here
R2_BUCKET_NAME=dj-star-movies
R2_PUBLIC_URL=https://pub-<hash>.r2.dev
R2_REGION=auto
```

### Where to find each value:

- **R2_ENDPOINT**: `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`
  - Find your Account ID in the Cloudflare dashboard under **Workers & Page** or in the URL of any Cloudflare page
- **R2_ACCESS_KEY_ID**: From the API token you created in Step 2
- **R2_SECRET_ACCESS_KEY**: From the API token you created in Step 2
- **R2_BUCKET_NAME**: The name you chose for your bucket (e.g., `dj-star-movies`)
- **R2_PUBLIC_URL**: Your bucket's public URL (if public access is enabled)
- **R2_REGION**: Always `auto` for R2

## How the Backend Uses R2

### Upload Process

1. **Movie Files**: Uploaded via `POST /api/admin/movies/:id/file` (admin only)
   - Files are stored in the `movies/` folder with a UUID prefix
   - The original filename is preserved after the UUID
   - Example key: `movies/abc123-def456-movie.mp4`

2. **Posters**: Uploaded via `POST /api/admin/movies/:id/poster`
   - Stored in the `posters/` folder

3. **Trailers**: Uploaded via `POST /api/admin/movies/:id/trailer`
   - Stored in the `trailers/` folder

### Streaming Process

1. User requests to stream a movie via `GET /api/stream/movie/:id`
2. Backend verifies authentication and ownership
3. Backend fetches the file directly from R2 and streams it to the user
4. HTTP Range Requests are supported for seeking and buffering
5. The frontend never knows the actual R2 file location

### Download Process

1. User requests to download via `GET /api/stream/download/:id`
2. Backend verifies authentication and ownership
3. Backend streams the file from R2 with appropriate Content-Disposition headers
4. Alternatively, a signed URL can be generated via `GET /api/stream/signed-url/:id` (expires in 1 hour)

## Security Recommendations

1. **Never expose R2 credentials** - They should only exist in your `.env` file
2. **Never expose raw R2 URLs** - All access must go through backend authorization
3. **Use signed URLs for temporary access** - The signed URL endpoint generates temporary URLs that expire
4. **Restrict bucket access** - Use IAM-style policies to restrict which API tokens can access the bucket
5. **Enable Object Lock** (optional) - To prevent accidental deletion of movie files
6. **Monitor usage** - Set up R2 usage alerts to monitor storage costs

## Folder Structure in R2

```
dj-star-movies/
├── movies/          # Full movie files (mp4, mkv, etc.)
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

## Troubleshooting

### "Failed to upload file to storage"
- Verify your R2 credentials in `.env`
- Ensure the bucket name is correct
- Check that your API token has write permissions

### "Failed to stream file from storage"
- Verify the file exists in R2
- Check that the movie record has the correct `movie_url` stored
- Ensure network connectivity to Cloudflare R2

### "Access Denied" errors
- Verify your API token has the correct permissions
- Check that the token is not expired
- Ensure the bucket policy allows the requested operation

### Slow uploads/downloads
- R2 is globally distributed; performance depends on your location
- For large files, consider using multipart upload (the backend stores files in memory before uploading; for production with very large files, implement streaming uploads)
