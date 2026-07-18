# Streaming Architecture

## Overview

Movies are stored in Cloudflare R2 (S3-compatible). The frontend never has direct access to R2 URLs. All streaming is proxied through the API server.

## Streaming Endpoints

### `GET /api/stream/trailer/:id`
- Public (no auth required)
- Streams movie trailer
- Supports HTTP Range Requests

### `GET /api/stream/movie/:id`
- Requires authentication + ownership
- Streams full movie
- Supports HTTP Range Requests (seeking, resume)

### `GET /api/stream/download/:id`
- Requires authentication + ownership
- Downloads movie as attachment

### `GET /api/stream/signed-url/:id`
- Requires authentication + ownership
- Returns temporary signed R2 URL (1-hour expiry)

## HTTP Range Requests

The streaming system supports partial content responses (HTTP 206):

```
Request:
  GET /api/stream/movie/123
  Range: bytes=0-999999

Response:
  HTTP/1.1 206 Partial Content
  Content-Range: bytes 0-999999/1048576000
  Content-Length: 1000000
  Content-Type: video/mp4
```

This enables:
- Seeking to any position in the video
- Resume playback from where user left off
- Efficient bandwidth usage
- Browser native video player support

## Ownership Verification

Before streaming or downloading:
1. Extract movie ID from params
2. Look up `user_library` for user+movie
3. If not found → 403 Forbidden
4. If found → proxy to R2

## URL Security

- R2 bucket URLs are never exposed to the frontend
- All streaming goes through the API proxy
- Signed URLs are temporary (1-hour expiry)
- Download links require fresh authentication

## Progress Tracking

The frontend should periodically save playback progress:
```json
POST /api/movies/library/progress
{
  "movieId": 123,
  "positionSeconds": 3600,
  "durationSeconds": 7200,
  "completed": false
}
```

## Optimizations

- Chunked streaming via HTTP Range
- Configurable chunk size (default: 8MB)
- Content-Type preserved from original file
- Cache-Control: private, max-age=3600
