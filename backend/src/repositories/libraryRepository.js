const prisma = require('../config/database');

const libraryRepository = {
  async addToLibrary(userId, movieId, orderId, purchasePrice) {
    await prisma.userLibrary.upsert({
      where: { userId_movieId: { userId, movieId } },
      update: { isAvailable: true, orderId },
      create: { userId, movieId, orderId, purchasePrice },
    });
  },

  async removeFromLibrary(userId, movieId) {
    await prisma.userLibrary.updateMany({
      where: { userId, movieId },
      data: { isAvailable: false },
    });
    return true;
  },

  async isOwned(userId, movieId) {
    const entry = await prisma.userLibrary.findFirst({
      where: { userId, movieId, isAvailable: true },
    });
    return entry !== null;
  },

  async getUserLibrary(userId, { page = 1, limit = 20 } = {}) {
    const where = { userId, isAvailable: true };

    const [rows, total] = await Promise.all([
      prisma.userLibrary.findMany({
        where,
        include: {
          movie: {
            include: { category: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.userLibrary.count({ where }),
    ]);

    const enrichedRows = await Promise.all(rows.map(async (entry) => {
      const progress = await prisma.playbackProgress.findFirst({
        where: { userId, movieId: entry.movieId },
      });
      return {
        ...entry,
        playback_progress: progress,
      };
    }));

    return { rows: enrichedRows, total };
  },

  async getLibraryCount(userId) {
    return prisma.userLibrary.count({
      where: { userId, isAvailable: true },
    });
  },

  async savePlaybackProgress(userId, movieId, positionSeconds, durationSeconds, completed = false) {
    await prisma.playbackProgress.upsert({
      where: { userId_movieId: { userId, movieId } },
      update: {
        positionSeconds,
        durationSeconds,
        completed,
        lastWatchedAt: new Date(),
      },
      create: {
        userId,
        movieId,
        positionSeconds,
        durationSeconds,
        completed,
        lastWatchedAt: new Date(),
      },
    });
  },

  async getPlaybackProgress(userId, movieId) {
    return prisma.playbackProgress.findUnique({
      where: { userId_movieId: { userId, movieId } },
    });
  },

  async getContinueWatching(userId, limit = 10) {
    return prisma.playbackProgress.findMany({
      where: {
        userId,
        completed: false,
        movie: {
          deletedAt: null,
        },
      },
      include: {
        movie: {
          include: { category: true },
        },
      },
      orderBy: { lastWatchedAt: 'desc' },
      take: limit,
    });
  },

  async logDownload(userId, movieId, ipAddress, userAgent) {
    const log = await prisma.downloadLog.create({
      data: { userId, movieId, ipAddress, userAgent },
    });
    return log.id;
  },

  async logStream(userId, movieId, ipAddress, userAgent) {
    const log = await prisma.streamLog.create({
      data: { userId, movieId, ipAddress, userAgent },
    });
    return log.id;
  },

  async getDownloadHistory(userId, { page = 1, limit = 20 } = {}) {
    const where = { userId };

    const [rows, total] = await Promise.all([
      prisma.downloadLog.findMany({
        where,
        include: { movie: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.downloadLog.count({ where }),
    ]);

    return { rows, total };
  },

  async getStreamHistory(userId, { page = 1, limit = 20 } = {}) {
    const where = { userId };

    const [rows, total] = await Promise.all([
      prisma.streamLog.findMany({
        where,
        include: { movie: true },
        orderBy: { startedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.streamLog.count({ where }),
    ]);

    return { rows, total };
  },
};

module.exports = libraryRepository;
