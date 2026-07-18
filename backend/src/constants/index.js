const ROLES = Object.freeze({
  USER: 'user',
  MOVIE_OWNER: 'movie_owner',
  DEVELOPER: 'developer',
});

const USER_STATUS = Object.freeze({
  ACTIVE: 'active',
  UNVERIFIED: 'unverified',
  SUSPENDED: 'suspended',
  DISABLED: 'disabled',
  DELETED: 'deleted',
});

const MOVIE_STATUS = Object.freeze({
  DRAFT: 'draft',
  PUBLISHED: 'published',
  HIDDEN: 'hidden',
  ARCHIVED: 'archived',
  UNAVAILABLE: 'unavailable',
});

const ORDER_STATUS = Object.freeze({
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
});

const PAYMENT_STATUS = Object.freeze({
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
});

const TICKET_PRIORITY = Object.freeze({
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
});

const TICKET_STATUS = Object.freeze({
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
});

const TRANSACTION_STATUS = Object.freeze({
  PENDING: 'pending',
  SUCCESS: 'success',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
});

const VERIFICATION_TYPE = Object.freeze({
  EMAIL: 'email_verification',
  PHONE: 'phone_verification',
  PASSWORD_RESET: 'password_reset',
});

const PAGINATION = Object.freeze({
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
});

const HTTP_STATUS = Object.freeze({
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  PAYMENT_REQUIRED: 402,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
});

const MOVIE_SORT_OPTIONS = Object.freeze({
  NEWEST: 'newest',
  OLDEST: 'oldest',
  MOST_VIEWED: 'most_viewed',
  MOST_PURCHASED: 'most_purchased',
  MOST_STREAMED: 'most_streamed',
  HIGHEST_RATED: 'highest_rated',
  TITLE_ASC: 'title_asc',
  TITLE_DESC: 'title_desc',
});

const MIME_TYPES = Object.freeze({
  POSTER: ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'],
  TRAILER: ['video/mp4', 'video/webm', 'video/x-msvideo', 'video/quicktime'],
  MOVIE: [
    'video/mp4', 'video/x-msvideo', 'video/x-matroska',
    'video/webm', 'video/ogg', 'video/quicktime',
    'application/octet-stream',
  ],
});

module.exports = {
  ROLES,
  USER_STATUS,
  MOVIE_STATUS,
  ORDER_STATUS,
  PAYMENT_STATUS,
  TICKET_PRIORITY,
  TICKET_STATUS,
  TRANSACTION_STATUS,
  VERIFICATION_TYPE,
  PAGINATION,
  HTTP_STATUS,
  MOVIE_SORT_OPTIONS,
  MIME_TYPES,
};
