const prisma = require('../config/database');

const reviewRepository = {
  async create(data) {
    const review = await prisma.review.create({
      data: {
        userId: data.userId,
        movieId: data.movieId,
        rating: data.rating,
        comment: data.comment || null,
      },
    });
    return review.id;
  },

  async findById(id) {
    return prisma.review.findUnique({
      where: { id },
      include: { user: { select: { id: true, username: true, avatarUrl: true } } },
    });
  },

  async findByUserAndMovie(userId, movieId) {
    return prisma.review.findUnique({
      where: { userId_movieId: { userId, movieId } },
    });
  },

  async findByMovie(movieId, { page = 1, limit = 20 } = {}) {
    const where = { movieId };

    const [rows, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: { user: { select: { id: true, username: true, avatarUrl: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.review.count({ where }),
    ]);

    return { rows, total };
  },

  async update(id, data) {
    const allowed = ['rating', 'comment'];
    const updateData = {};
    for (const [key, value] of Object.entries(data)) {
      if (allowed.includes(key) && value !== undefined) {
        updateData[key] = value;
      }
    }
    if (Object.keys(updateData).length === 0) {return false;}
    await prisma.review.update({ where: { id }, data: updateData });
    return true;
  },

  async delete(id) {
    await prisma.review.delete({ where: { id } });
    return true;
  },

  async getMovieStats(movieId) {
    const stats = await prisma.review.aggregate({
      where: { movieId },
      _avg: { rating: true },
      _count: { id: true },
    });
    return {
      averageRating: stats._avg.rating || 0,
      reviewCount: stats._count.id || 0,
    };
  },

  async getMoviesStats(movieIds) {
    if (!movieIds || movieIds.length === 0) {return {};}
    const stats = await prisma.review.groupBy({
      by: ['movieId'],
      where: { movieId: { in: movieIds } },
      _avg: { rating: true },
      _count: { id: true },
    });
    const map = {};
    stats.forEach(s => {
      map[s.movieId] = {
        averageRating: s._avg.rating || 0,
        reviewCount: s._count.id || 0,
      };
    });
    return map;
  },

  async getUserReviewStats(userId) {
    const stats = await prisma.review.aggregate({
      where: { userId },
      _count: { id: true },
      _avg: { rating: true },
    });
    return {
      totalReviews: stats._count.id || 0,
      averageRating: stats._avg.rating || 0,
    };
  },
};

module.exports = reviewRepository;
