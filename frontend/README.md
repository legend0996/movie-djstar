# DJ Star Original Movies — Frontend

## Project Description

Frontend application for the DJ Star Original Movies platform — a commercial movie streaming service. Built as a single-page application (SPA) that communicates with the backend REST API.

**Features:**
- Browse and search movie catalog
- User registration and authentication
- Movie purchasing via M-Pesa STK Push
- Video streaming with seeking and resume playback
- Movie downloads
- Personal library and continue watching
- Admin dashboards (movie owner and developer)
- Support ticket system
- In-app notifications

## Tech Stack

- **Framework:** React (Vite)
- **State Management:** React Context + custom hooks
- **Routing:** React Router
- **HTTP Client:** Axios or Fetch API
- **Styling:** CSS Modules or styled-components (inferred from structure)
- **Video Player:** HTML5 video element with HLS.js or native playback

## Quick Start

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with API URL and other settings

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_URL` | Yes | `http://localhost:5000/api` | Backend API base URL |
| `VITE_WS_URL` | No | `ws://localhost:5000` | WebSocket URL (future) |
| `VITE_APP_NAME` | No | DJ Star Original Movies | Application name |
| `VITE_ENVIRONMENT` | No | development | Runtime environment |

## Project Structure

```
frontend/
├── public/                     # Static assets
├── src/
│   ├── api/                    # API client and endpoint functions
│   ├── assets/                 # Images, fonts, icons
│   ├── components/             # Shared/reusable components
│   │   ├── common/             # Button, Input, Modal, Spinner, etc.
│   │   ├── layout/             # Header, Footer, Sidebar, etc.
│   │   ├── movie/              # MovieCard, MovieGrid, MovieDetail
│   │   ├── player/             # VideoPlayer, SeekBar, Controls
│   │   └── admin/              # Admin-specific components
│   ├── constants/              # App constants, enums, config
│   ├── context/                # React contexts (Auth, Theme, etc.)
│   ├── hooks/                  # Custom React hooks
│   │   ├── useApi.js           # API request hook
│   │   ├── useAuth.js          # Authentication state
│   │   └── useLocalStorage.js  # Persistent state
│   ├── layouts/                # Page layout wrappers
│   ├── pages/                  # Route page components
│   │   ├── auth/               # Login, Register, Verify
│   │   ├── movies/             # Browse, Search, Detail
│   │   ├── library/            # My Library, Downloads
│   │   ├── player/             # Video player page
│   │   ├── support/            # Support tickets
│   │   ├── admin/              # Dashboards, management
│   │   └── profile/            # Profile, settings
│   ├── routes/                 # Route definitions
│   ├── services/               # Business logic services
│   ├── store/                  # State management (future: Redux/Zustand)
│   ├── styles/                 # Global styles, themes
│   ├── types/                  # TypeScript type definitions
│   └── utils/                  # Helper functions
├── .env.example
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

**Note:** The directory structure is pre-created for future development. Components, pages, and other source files are to be implemented as part of the frontend development process.

## API Integration Guide

### Authentication

The frontend should manage authentication tokens as follows:

```javascript
// Store tokens after login
localStorage.setItem('accessToken', data.tokens.accessToken);
localStorage.setItem('refreshToken', data.tokens.refreshToken);

// Include token in all API requests
const response = await fetch(`${API_URL}/movies`, {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
    'Content-Type': 'application/json',
  },
});

// Handle token refresh
async function refreshToken() {
  const response = await fetch(`${API_URL}/auth/refresh-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      refreshToken: localStorage.getItem('refreshToken'),
    }),
  });
  const data = await response.json();
  localStorage.setItem('accessToken', data.data.accessToken);
  localStorage.setItem('refreshToken', data.data.refreshToken);
  return data.data.accessToken;
}
```

### API Response Handling

All API responses follow a consistent format:

```javascript
// Success
{
  success: true,
  message: 'Operation successful',
  data: { ... },
}

// Paginated
{
  success: true,
  data: [ ... ],
  pagination: {
    page: 1,
    limit: 20,
    total: 150,
    totalPages: 8,
    hasNext: true,
    hasPrev: false,
  },
}

// Error
{
  success: false,
  message: 'Validation failed',
  errorCode: 'VALIDATION_ERROR',
  details: [
    { field: 'email', message: 'Please provide a valid email address' },
  ],
}
```

### Streaming Integration

For video streaming, the HTML5 video element can consume the streaming endpoints directly:

```jsx
<video controls>
  <source src={`${API_URL}/stream/movie/${movieId}`} type="video/mp4" />
</video>
```

The backend handles:
- HTTP Range Requests (seeking, buffering, resume)
- Authentication (via Authorization header)
- Ownership verification

### Payment Flow

1. User clicks "Purchase" on a movie
2. Frontend calls `POST /api/payments/purchase` with `{ movieId, phoneNumber }`
3. Backend returns `{ checkoutRequestID, message: "STK Push sent..." }`
4. Frontend shows "Check your phone to complete payment" message
5. Frontend polls `GET /api/payments/status/:checkoutRequestId` every 3 seconds
6. When status changes to `successful` or `failed`, show appropriate message
7. On success, redirect user to their library

## Build and Deployment

### Development

```bash
npm run dev
# Starts Vite dev server on http://localhost:5173
```

### Production Build

```bash
npm run build
# Output in dist/
```

### Serve Production Build

```bash
# Option 1: Vite preview
npm run preview

# Option 2: Nginx (recommended)
# Serve dist/ directory with Nginx
# See docs/DEPLOYMENT.md for Nginx configuration
```

### Environment-Specific Builds

```bash
# Development
npm run dev

# Staging
VITE_API_URL=https://staging-api.yourdomain.com npm run build

# Production
VITE_API_URL=https://api.yourdomain.com npm run build
```

### Vite Configuration

The project uses Vite as the build tool. Key configuration in `vite.config.js`:

```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
  },
});
```

The proxy configuration allows the development server to forward `/api` requests to the backend, avoiding CORS issues during development.

## Related Documentation

- Full API Reference: [docs/API.md](../docs/API.md)
- Deployment Guide: [docs/DEPLOYMENT.md](../docs/DEPLOYMENT.md)
- Security: [docs/SECURITY.md](../docs/SECURITY.md)
- Streaming: [docs/STREAMING.md](../docs/STREAMING.md)
- Payments: [docs/MPESA.md](../docs/MPESA.md)
