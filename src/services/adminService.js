const db = require('../config/database');
const config = require('../config');
const userRepository = require('../repositories/userRepository');
const movieRepository = require('../repositories/movieRepository');
const categoryRepository = require('../repositories/categoryRepository');
const orderRepository = require('../repositories/orderRepository');
const transactionRepository = require('../repositories/transactionRepository');
const r2Service = require('./r2Service');
const { logActivity } = require('../middleware/activityLogger');
const { NotFoundError, ValidationError, ConflictError } = require('../utils/errors');
const { slugify, calculatePopularityScore } = require('../utils/helpers');

const adminService = {
  async getMovieOwnerDashboard() {
    const totalMovies = await movieRepository.countAll();
    const publishedCount = await movieRepository.countByStatus('published');
    const draftCount = await movieRepository.countByStatus('draft');
    const hiddenCount = await movieRepository.countByStatus('hidden');

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(todayStart.getTime() - 7 * 86400000);
    const monthAgo = new Date(todayStart.getTime() - 30 * 86400000);

    const todaySales = await orderRepository.getRevenueForPeriod(todayStart, new Date(todayStart.getTime() + 86400000));
    const weekSales = await orderRepository.getRevenueForPeriod(weekAgo, now);
    const monthSales = await orderRepository.getRevenueForPeriod(monthAgo, now);
    const lifetimeRevenue = await orderRepository.getTotalRevenue();

    const [customerCount] = await db.execute(
      `SELECT COUNT(DISTINCT user_id) as count FROM user_library`
    );

    const [newCustomers] = await db.execute(
      `SELECT COUNT(DISTINCT user_id) as count FROM user_library WHERE created_at >= ?`,
      [monthAgo]
    );

    const [streamStats] = await db.execute(`SELECT COUNT(*) as total FROM stream_log WHERE started_at >= ?`, [monthAgo]);
    const [downloadStats] = await db.execute(`SELECT COUNT(*) as total FROM download_log WHERE created_at >= ?`, [monthAgo]);

    const topSelling = await db.execute(
      `SELECT m.id, m.title, m.slug, m.poster_url, COUNT(oi.id) as total_sales, SUM(oi.item_price) as revenue
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       JOIN movies m ON oi.movie_id = m.id
       WHERE o.payment_status = 'paid'
       GROUP BY m.id
       ORDER BY total_sales DESC
       LIMIT 10`
    );

    const mostStreamed = await db.execute(
      `SELECT m.id, m.title, m.slug, m.poster_url, COUNT(sl.id) as stream_count
       FROM stream_log sl
       JOIN movies m ON sl.movie_id = m.id
       WHERE sl.started_at >= ?
       GROUP BY m.id
       ORDER BY stream_count DESC
       LIMIT 10`,
      [monthAgo]
    );

    const [recentPurchases] = await db.execute(
      `SELECT o.id, o.order_number, o.total_amount, o.created_at, u.username, u.email
       FROM orders o
       JOIN users u ON o.user_id = u.id
       WHERE o.payment_status = 'paid'
       ORDER BY o.created_at DESC
       LIMIT 10`
    );

    const [recentActivity] = await db.execute(
      `SELECT ual.*, u.username FROM user_activity_log ual
       JOIN users u ON ual.user_id = u.id
       WHERE ual.action IN ('purchase_completed', 'login', 'registration')
       ORDER BY ual.created_at DESC
       LIMIT 20`
    );

    return {
      movies: {
        total: totalMovies,
        published: publishedCount,
        draft: draftCount,
        hidden: hiddenCount,
      },
      sales: {
        today: todaySales,
        week: weekSales,
        month: monthSales,
        lifetime: lifetimeRevenue,
      },
      customers: {
        total: customerCount[0]?.count || 0,
        newThisMonth: newCustomers[0]?.count || 0,
      },
      streamsThisMonth: streamStats[0]?.total || 0,
      downloadsThisMonth: downloadStats[0]?.total || 0,
      topSelling: topSelling[0],
      mostStreamed: mostStreamed[0],
      recentPurchases,
      recentActivity,
    };
  },

  async getDeveloperDashboard() {
    const totalUsers = await userRepository.countAll();
    const activeUsers = await userRepository.countByStatus('active');
    const unverifiedUsers = await userRepository.countByStatus('unverified');
    const suspendedUsers = await userRepository.countByStatus('suspended');

    const [roleCounts] = await db.execute(
      `SELECT r.name, r.slug, COUNT(u.id) as count
       FROM roles r
       LEFT JOIN users u ON u.role_id = r.id AND u.deleted_at IS NULL
       GROUP BY r.id`
    );

    const totalMovies = await movieRepository.countAll();
    const totalMoviesPublished = await movieRepository.countByStatus('published');

    const [ordersStats] = await db.execute(
      `SELECT COUNT(*) as total_orders,
              SUM(CASE WHEN payment_status = 'paid' THEN 1 ELSE 0 END) as paid_orders,
              SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END) as total_revenue
       FROM orders`
    );

    const [commissionStats] = await db.execute(
      `SELECT
        COALESCE(SUM(developer_commission), 0) as total_commission,
        COALESCE(SUM(owner_earnings), 0) as total_owner_earnings
       FROM revenue_records`
    );

    const [storageStats] = await db.execute(
      `SELECT COUNT(*) as file_count, COALESCE(SUM(movie_size), 0) as total_size
       FROM movies WHERE movie_url IS NOT NULL AND deleted_at IS NULL`
    );

    const [streamTotal] = await db.execute(`SELECT COUNT(*) as total FROM stream_log`);
    const [downloadTotal] = await db.execute(`SELECT COUNT(*) as total FROM download_log`);

    const [todayStats] = await db.execute(
      `SELECT
        (SELECT COUNT(*) FROM users WHERE DATE(created_at) = CURDATE()) as new_users,
        (SELECT COUNT(*) FROM orders WHERE DATE(created_at) = CURDATE()) as new_orders,
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE DATE(paid_at) = CURDATE() AND payment_status = 'paid') as today_revenue`
    );

    const [recentErrors] = await db.execute(
      `SELECT * FROM user_activity_log
       WHERE action IN ('failed_login', 'payment_failed', 'account_locked')
       ORDER BY created_at DESC
       LIMIT 20`
    );

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        unverified: unverifiedUsers,
        suspended: suspendedUsers,
        byRole: roleCounts,
      },
      movies: {
        total: totalMovies,
        published: totalMoviesPublished,
      },
      orders: {
        total: ordersStats[0]?.total_orders || 0,
        paid: ordersStats[0]?.paid_orders || 0,
        totalRevenue: ordersStats[0]?.total_revenue || 0,
      },
      commissions: {
        developerCommission: commissionStats[0]?.total_commission || 0,
        ownerEarnings: commissionStats[0]?.total_owner_earnings || 0,
        commissionRate: config.commission.developerPercentage,
      },
      storage: {
        fileCount: storageStats[0]?.file_count || 0,
        totalSizeBytes: storageStats[0]?.total_size || 0,
      },
      activity: {
        totalStreams: streamTotal[0]?.total || 0,
        totalDownloads: downloadTotal[0]?.total || 0,
        newUsersToday: todayStats[0]?.new_users || 0,
        newOrdersToday: todayStats[0]?.new_orders || 0,
        todayRevenue: todayStats[0]?.today_revenue || 0,
      },
      recentErrors,
    };
  },

  async uploadMoviePoster(file, movieId) {
    const movie = await movieRepository.findById(movieId);
    if (!movie) throw new NotFoundError('Movie not found');

    const result = await r2Service.uploadFile(
      file.buffer,
      `poster-${Date.now()}-${file.originalname}`,
      file.mimetype,
      'posters'
    );

    const publicUrl = await r2Service.getPublicUrl(result.key);
    await movieRepository.update(movieId, { poster_url: publicUrl || result.key });

    return { url: publicUrl || result.key, key: result.key };
  },

  async uploadMovieTrailer(file, movieId) {
    const movie = await movieRepository.findById(movieId);
    if (!movie) throw new NotFoundError('Movie not found');

    const result = await r2Service.uploadFile(
      file.buffer,
      `trailer-${Date.now()}-${file.originalname}`,
      file.mimetype,
      'trailers'
    );

    const publicUrl = await r2Service.getPublicUrl(result.key);
    await movieRepository.update(movieId, { trailer_url: publicUrl || result.key });

    return { url: publicUrl || result.key, key: result.key };
  },

  async uploadMovieFile(file, movieId) {
    const movie = await movieRepository.findById(movieId);
    if (!movie) throw new NotFoundError('Movie not found');

    const result = await r2Service.uploadFile(
      file.buffer,
      `movie-${Date.now()}-${file.originalname}`,
      file.mimetype || 'video/mp4',
      'movies'
    );

    await movieRepository.update(movieId, {
      movie_url: result.key,
      movie_size: file.size,
      movie_format: file.originalname.split('.').pop(),
    });

    return { key: result.key };
  },

  async getAuditLogs({ page = 1, limit = 50, action, userId, entityType, startDate, endDate } = {}) {
    const offset = (page - 1) * limit;
    let where = 'WHERE 1=1';
    const params = [];

    if (action) { where += ' AND al.action = ?'; params.push(action); }
    if (userId) { where += ' AND al.user_id = ?'; params.push(userId); }
    if (entityType) { where += ' AND al.entity_type = ?'; params.push(entityType); }
    if (startDate) { where += ' AND al.created_at >= ?'; params.push(startDate); }
    if (endDate) { where += ' AND al.created_at <= ?'; params.push(endDate); }

    const [rows] = await db.execute(
      `SELECT al.*, u.username
       FROM audit_logs al
       LEFT JOIN users u ON al.user_id = u.id
       ${where}
       ORDER BY al.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [countResult] = await db.execute(
      `SELECT COUNT(*) as total FROM audit_logs al ${where}`,
      params
    );

    return { rows, total: countResult[0].total };
  },

  async getUserManagementList({ page = 1, limit = 20, status, role, search } = {}) {
    return userRepository.findAll(page, limit, { status, role, search });
  },

  async updateUserStatus(userId, status) {
    const user = await userRepository.findById(userId);
    if (!user) throw new NotFoundError('User not found');

    const validStatuses = ['active', 'unverified', 'suspended', 'disabled'];
    if (!validStatuses.includes(status)) {
      throw new ValidationError('Invalid status');
    }

    await userRepository.update(userId, { status });

    if (status === 'suspended' || status === 'disabled') {
      await db.execute(
        `UPDATE user_sessions SET is_active = 0, revoked_at = NOW()
         WHERE user_id = ? AND is_active = 1`,
        [userId]
      );
    }

    return { message: `User status updated to ${status}` };
  },

  async getSupportTickets({ page = 1, limit = 20, status, priority } = {}) {
    const offset = (page - 1) * limit;
    let where = 'WHERE 1=1';
    const params = [];

    if (status) { where += ' AND st.status = ?'; params.push(status); }
    if (priority) { where += ' AND st.priority = ?'; params.push(priority); }

    const [rows] = await db.execute(
      `SELECT st.*, u.username, u.email
       FROM support_tickets st
       JOIN users u ON st.user_id = u.id
       ${where}
       ORDER BY
         CASE st.priority
           WHEN 'urgent' THEN 0
           WHEN 'high' THEN 1
           WHEN 'medium' THEN 2
           WHEN 'low' THEN 3
         END, st.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [countResult] = await db.execute(
      `SELECT COUNT(*) as total FROM support_tickets st ${where}`,
      params
    );

    return { rows, total: countResult[0].total };
  },

  async getAnalytics({ startDate, endDate } = {}) {
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 86400000);

    const [userGrowth] = await db.execute(
      `SELECT DATE(created_at) as date, COUNT(*) as count
       FROM users WHERE created_at >= ? AND created_at <= ? AND deleted_at IS NULL
       GROUP BY DATE(created_at)
       ORDER BY date`,
      [start, end]
    );

    const [revenueTrend] = await db.execute(
      `SELECT DATE(paid_at) as date, SUM(total_amount) as revenue, COUNT(*) as orders
       FROM orders
       WHERE payment_status = 'paid' AND paid_at >= ? AND paid_at <= ?
       GROUP BY DATE(paid_at)
       ORDER BY date`,
      [start, end]
    );

    const [moviesByCategory] = await db.execute(
      `SELECT c.name, c.slug, COUNT(m.id) as count
       FROM categories c
       LEFT JOIN movies m ON m.category_id = c.id AND m.status = 'published' AND m.deleted_at IS NULL
       GROUP BY c.id
       ORDER BY count DESC`
    );

    const [purchaseTrend] = await db.execute(
      `SELECT DATE(o.paid_at) as date, COUNT(DISTINCT o.id) as purchases
       FROM orders o
       WHERE o.payment_status = 'paid' AND o.paid_at >= ? AND o.paid_at <= ?
       GROUP BY DATE(o.paid_at)
       ORDER BY date`,
      [start, end]
    );

    return {
      userGrowth,
      revenueTrend,
      moviesByCategory,
      purchaseTrend,
      period: { start, end },
    };
  },
};

module.exports = adminService;
