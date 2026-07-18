const jwt = require('jsonwebtoken');
const config = require('../../config');

function createMockUser(overrides = {}) {
  return {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    phone: '254712345678',
    password_hash: '$2a$12$LJ3m4ys3Lk0TSwHl6z5EfOBhFt7G3Px9q8y5d4c2b1a0n9m8k7j6h5',
    first_name: 'Test',
    last_name: 'User',
    avatar_url: null,
    role_id: 3,
    role_slug: 'user',
    role_name: 'User',
    status: 'active',
    email_verified_at: new Date('2024-01-01'),
    last_login_at: new Date('2024-06-15'),
    login_attempts: 0,
    locked_until: null,
    password_changed_at: new Date('2024-01-01'),
    deleted_at: null,
    created_at: new Date('2024-01-01'),
    ...overrides,
  };
}

function createMockMovie(overrides = {}) {
  return {
    id: 1,
    title: 'Test Movie',
    slug: 'test-movie',
    description: 'A test movie description',
    short_description: 'Short description',
    category_id: 1,
    category: { id: 1, name: 'Action', slug: 'action' },
    duration: 7200,
    release_year: 2024,
    language: 'English',
    quality: 'HD',
    age_rating: 'PG-13',
    director: 'John Doe',
    cast_members: ['Actor One', 'Actor Two'],
    poster_url: 'https://example.com/poster.jpg',
    trailer_url: 'https://example.com/trailer.mp4',
    movie_url: 'movies/test-movie.mp4',
    movie_size: 1048576000,
    movie_format: 'mp4',
    price: 5.99,
    is_free: false,
    is_featured: false,
    status: 'published',
    is_series: false,
    series_id: null,
    episode_number: null,
    season_number: null,
    total_views: 100,
    total_purchases: 10,
    total_streams: 50,
    total_downloads: 5,
    popularity_score: 500,
    created_by: 1,
    published_at: new Date('2024-06-01'),
    deleted_at: null,
    created_at: new Date('2024-06-01'),
    updated_at: new Date('2024-06-01'),
    ...overrides,
  };
}

function createMockOrder(overrides = {}) {
  return {
    id: 1,
    user_id: 1,
    order_number: 'DJ-TEST123-ABCD',
    total_amount: 5.99,
    status: 'completed',
    payment_status: 'paid',
    paid_at: new Date('2024-06-15'),
    notes: null,
    deleted_at: null,
    created_at: new Date('2024-06-15'),
    updated_at: new Date('2024-06-15'),
    items: [
      {
        id: 1,
        order_id: 1,
        movie_id: 1,
        item_price: 5.99,
        movie: createMockMovie(),
      },
    ],
    ...overrides,
  };
}

function createMockTransaction(overrides = {}) {
  return {
    id: 1,
    user_id: 1,
    order_id: 1,
    transaction_reference: null,
    merchant_request_id: 'MERCH-001',
    checkout_request_id: 'CHECK-001',
    phone_number: '254712345678',
    amount: 5.99,
    currency: 'KES',
    status: 'success',
    payment_method: 'mpesa_buy_goods',
    payment_provider: 'safaricom',
    mpesa_receipt: 'MPE123456',
    result_code: '0',
    result_description: 'Success',
    transaction_date: new Date('2024-06-15'),
    callback_received_at: new Date('2024-06-15'),
    callback_data: null,
    metadata: { movieId: 1, movieTitle: 'Test Movie', orderNumber: 'DJ-TEST123-ABCD' },
    user: createMockUser(),
    created_at: new Date('2024-06-15'),
    updated_at: new Date('2024-06-15'),
    ...overrides,
  };
}

function createMockToken(user = null) {
  const payload = {
    sub: user ? user.id : 1,
    username: user ? user.username : 'testuser',
    role: user ? (user.role?.slug || user.role_slug) : 'user',
  };
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: '1h',
    issuer: config.jwt.issuer,
  });
}

function createMockRefreshToken(user = null) {
  const payload = {
    sub: user ? user.id : 1,
    type: 'refresh',
  };
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: '7d',
    issuer: config.jwt.issuer,
  });
}

function paginatedResponse(data, total, page = 1, limit = 20) {
  const totalPages = Math.ceil(total / limit);
  return {
    success: true,
    message: 'Success',
    data,
    errorCode: null,
    details: null,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
}

module.exports = {
  createMockUser,
  createMockMovie,
  createMockOrder,
  createMockTransaction,
  createMockToken,
  createMockRefreshToken,
  paginatedResponse,
};
