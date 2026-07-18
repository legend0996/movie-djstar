const prisma = require('../config/database');

const analyticsRepository = {
  async getMovieOwnerDashboard() {
    const [
      totalOwners,
      totalMovies,
      movieAgg,
      totalRevenue,
      recentOrders,
    ] = await Promise.all([
      prisma.user.count({
        where: { role: { slug: 'movie_owner' }, deletedAt: null },
      }),
      prisma.movie.count({
        where: { deletedAt: null },
      }),
      prisma.movie.aggregate({
        _sum: {
          totalViews: true,
          totalPurchases: true,
          totalStreams: true,
          totalDownloads: true,
        },
        where: { deletedAt: null },
      }),
      prisma.revenueRecord.aggregate({
        _sum: { ownerEarnings: true },
      }),
      prisma.order.findMany({
        where: { paymentStatus: 'paid' },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          user: true,
          items: { include: { movie: true } },
        },
      }),
    ]);

    return {
      total_owners: totalOwners,
      total_movies: totalMovies,
      total_views: movieAgg._sum.totalViews || 0,
      total_purchases: movieAgg._sum.totalPurchases || 0,
      total_streams: movieAgg._sum.totalStreams || 0,
      total_downloads: movieAgg._sum.totalDownloads || 0,
      total_earnings: totalRevenue._sum.ownerEarnings || 0,
      recent_orders: recentOrders,
    };
  },

  async getDeveloperDashboard() {
    const [
      totalUsers,
      totalMovies,
      totalOrders,
      revenueAgg,
      platformStats,
      totalStreams,
      totalDownloads,
    ] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.movie.count({ where: { deletedAt: null } }),
      prisma.order.count(),
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { paymentStatus: 'paid' },
      }),
      prisma.platformStatistic.findFirst({
        orderBy: { statDate: 'desc' },
      }),
      prisma.movie.aggregate({
        _sum: { totalStreams: true },
        where: { deletedAt: null },
      }),
      prisma.movie.aggregate({
        _sum: { totalDownloads: true },
        where: { deletedAt: null },
      }),
    ]);

    return {
      total_users: totalUsers,
      total_movies: totalMovies,
      total_orders: totalOrders,
      total_revenue: revenueAgg._sum.totalAmount || 0,
      total_streams: totalStreams._sum.totalStreams || 0,
      total_downloads: totalDownloads._sum.totalDownloads || 0,
      latest_platform_stats: platformStats,
    };
  },

  async getRevenueReport(startDate, endDate) {
    const [paidOrders, revenueRecords, dailyStats] = await Promise.all([
      prisma.order.findMany({
        where: {
          paymentStatus: 'paid',
          paidAt: { gte: startDate, lte: endDate },
        },
        orderBy: { paidAt: 'asc' },
      }),
      prisma.revenueRecord.findMany({
        where: {
          recordedAt: { gte: startDate, lte: endDate },
        },
        orderBy: { recordedAt: 'asc' },
      }),
      prisma.platformStatistic.findMany({
        where: {
          statDate: { gte: startDate, lte: endDate },
        },
        orderBy: { statDate: 'asc' },
      }),
    ]);

    const orderAgg = await prisma.order.aggregate({
      _sum: { totalAmount: true },
      _count: { id: true },
      where: {
        paymentStatus: 'paid',
        paidAt: { gte: startDate, lte: endDate },
      },
    });

    const revenueAgg = await prisma.revenueRecord.aggregate({
      _sum: {
        totalAmount: true,
        developerCommission: true,
        ownerEarnings: true,
      },
      where: {
        recordedAt: { gte: startDate, lte: endDate },
      },
    });

    return {
      total_revenue: orderAgg._sum.totalAmount || 0,
      total_orders: orderAgg._count.id,
      developer_commission: revenueAgg._sum.developerCommission || 0,
      owner_earnings: revenueAgg._sum.ownerEarnings || 0,
      gross_revenue: revenueAgg._sum.totalAmount || 0,
      orders: paidOrders,
      revenue_records: revenueRecords,
      daily_stats: dailyStats,
    };
  },

  async getAnalytics(startDate, endDate) {
    const [
      newUsers,
      totalMovies,
      orders,
      revenue,
      movieAgg,
      dailyStats,
    ] = await Promise.all([
      prisma.user.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          deletedAt: null,
        },
      }),
      prisma.movie.count({
        where: { deletedAt: null },
      }),
      prisma.order.aggregate({
        _count: { id: true },
        _sum: { totalAmount: true },
        where: {
          paymentStatus: 'paid',
          paidAt: { gte: startDate, lte: endDate },
        },
      }),
      prisma.revenueRecord.aggregate({
        _sum: {
          developerCommission: true,
          ownerEarnings: true,
          totalAmount: true,
        },
        where: {
          recordedAt: { gte: startDate, lte: endDate },
        },
      }),
      prisma.movie.aggregate({
        _sum: {
          totalViews: true,
          totalStreams: true,
          totalDownloads: true,
        },
        where: { deletedAt: null },
      }),
      prisma.platformStatistic.findMany({
        where: {
          statDate: { gte: startDate, lte: endDate },
        },
        orderBy: { statDate: 'asc' },
      }),
    ]);

    return {
      new_users: newUsers,
      total_movies: totalMovies,
      total_orders: orders._count.id || 0,
      total_revenue: orders._sum.totalAmount || 0,
      developer_commission: revenue._sum.developerCommission || 0,
      owner_earnings: revenue._sum.ownerEarnings || 0,
      total_views: movieAgg._sum.totalViews || 0,
      total_streams: movieAgg._sum.totalStreams || 0,
      total_downloads: movieAgg._sum.totalDownloads || 0,
      daily_stats: dailyStats,
    };
  },

  async getMovieViewsDaily(movieId, startDate, endDate) {
    return prisma.movieViewsDaily.findMany({
      where: {
        movieId,
        viewDate: { gte: startDate, lte: endDate },
      },
      orderBy: { viewDate: 'asc' },
    });
  },

  async upsertPlatformStatistics(date, data) {
    await prisma.platformStatistic.upsert({
      where: { statDate: date },
      update: {
        totalUsers: data.totalUsers,
        newUsers: data.newUsers,
        totalMovies: data.totalMovies,
        totalOrders: data.totalOrders,
        totalRevenue: data.totalRevenue,
        developerCommission: data.developerCommission,
        ownerEarnings: data.ownerEarnings,
        totalStreams: data.totalStreams,
        totalDownloads: data.totalDownloads,
        activeUsers: data.activeUsers,
      },
      create: {
        statDate: date,
        totalUsers: data.totalUsers || 0,
        newUsers: data.newUsers || 0,
        totalMovies: data.totalMovies || 0,
        totalOrders: data.totalOrders || 0,
        totalRevenue: data.totalRevenue || 0,
        developerCommission: data.developerCommission || 0,
        ownerEarnings: data.ownerEarnings || 0,
        totalStreams: data.totalStreams || 0,
        totalDownloads: data.totalDownloads || 0,
        activeUsers: data.activeUsers || 0,
      },
    });
  },

  async getDailyStats(startDate, endDate) {
    return prisma.platformStatistic.findMany({
      where: {
        statDate: { gte: startDate, lte: endDate },
      },
      orderBy: { statDate: 'asc' },
    });
  },
};

module.exports = analyticsRepository;
