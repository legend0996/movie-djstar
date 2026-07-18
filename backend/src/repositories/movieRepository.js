const prisma = require('../config/database');

const movieRepository = {
  async findById(id) {
    return prisma.movie.findUnique({
      where: { id },
      include: { category: true },
    });
  },

  async findBySlug(slug) {
    return prisma.movie.findFirst({
      where: { slug, deletedAt: null },
      include: { category: true },
    });
  },

  async create(data) {
    const movie = await prisma.movie.create({
      data: {
        categoryId: data.categoryId || null,
        title: data.title,
        slug: data.slug,
        description: data.description || null,
        shortDescription: data.shortDescription || null,
        duration: data.duration || null,
        releaseYear: data.releaseYear || null,
        language: data.language || 'English',
        quality: data.quality || 'HD',
        ageRating: data.ageRating || null,
        director: data.director || null,
        castMembers: data.castMembers || undefined,
        posterUrl: data.posterUrl || null,
        coverUrl: data.coverUrl || null,
        trailerUrl: data.trailerUrl || null,
        thumbnailUrl: data.thumbnailUrl || null,
        movieUrl: data.movieUrl || null,
        movieSize: data.movieSize || null,
        movieFormat: data.movieFormat || null,
        price: data.price || 0,
        isFree: data.isFree || false,
        isFeatured: data.isFeatured || false,
        status: data.status || 'draft',
        isSeries: data.isSeries || false,
        seriesId: data.seriesId || null,
        episodeNumber: data.episodeNumber || null,
        seasonNumber: data.seasonNumber || null,
        publishedAt: data.publishedAt || null,
        createdBy: data.createdBy || null,
      },
    });
    return movie.id;
  },

  async update(id, data) {
    const allowed = [
      'categoryId', 'title', 'slug', 'description', 'shortDescription',
      'duration', 'releaseYear', 'language', 'quality', 'ageRating',
      'director', 'castMembers', 'posterUrl', 'coverUrl', 'trailerUrl',
      'thumbnailUrl', 'movieUrl', 'movieSize', 'movieFormat', 'price',
      'isFree', 'isFeatured', 'status', 'isSeries', 'seriesId',
      'episodeNumber', 'seasonNumber', 'publishedAt',
    ];
    const updateData = {};
    for (const [key, value] of Object.entries(data)) {
      if (allowed.includes(key) && value !== undefined) {
        updateData[key] = value;
      }
    }
    if (Object.keys(updateData).length === 0) {return false;}
    await prisma.movie.update({ where: { id }, data: updateData });
    return true;
  },

  async delete(id) {
    await prisma.movie.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'archived' },
    });
    return true;
  },

  async findAll({ page = 1, limit = 20, status, categoryId, isFree, search, sort = 'newest', featured } = {}) {
    const where = { deletedAt: null };

    if (status) {
      where.status = status;
    } else {
      where.status = 'published';
    }
    if (categoryId) {
      where.categoryId = categoryId;
    }
    if (isFree !== undefined) {
      where.isFree = isFree;
    }
    if (featured) {
      where.isFeatured = true;
    }
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { shortDescription: { contains: search } },
      ];
    }

    let orderBy;
    switch (sort) {
      case 'newest': orderBy = { createdAt: 'desc' }; break;
      case 'oldest': orderBy = { createdAt: 'asc' }; break;
      case 'popular': orderBy = { popularityScore: 'desc' }; break;
      case 'price_asc': orderBy = { price: 'asc' }; break;
      case 'price_desc': orderBy = { price: 'desc' }; break;
      case 'title': orderBy = { title: 'asc' }; break;
      default: orderBy = { createdAt: 'desc' };
    }

    const [rows, total] = await Promise.all([
      prisma.movie.findMany({
        where,
        include: { category: true },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.movie.count({ where }),
    ]);

    return { rows, total };
  },

  async incrementViews(id) {
    await prisma.movie.update({
      where: { id },
      data: { totalViews: { increment: 1 } },
    });
  },

  async incrementPurchases(id) {
    await prisma.movie.update({
      where: { id },
      data: {
        totalPurchases: { increment: 1 },
        popularityScore: { increment: 10 },
      },
    });
  },

  async incrementStreams(id) {
    await prisma.movie.update({
      where: { id },
      data: {
        totalStreams: { increment: 1 },
        popularityScore: { increment: 3 },
      },
    });
  },

  async incrementDownloads(id) {
    await prisma.movie.update({
      where: { id },
      data: {
        totalDownloads: { increment: 1 },
        popularityScore: { increment: 5 },
      },
    });
  },

  async getPopular(limit = 10) {
    return prisma.movie.findMany({
      where: { status: 'published', deletedAt: null },
      include: { category: true },
      orderBy: { popularityScore: 'desc' },
      take: limit,
    });
  },

  async getRecent(limit = 10) {
    return prisma.movie.findMany({
      where: { status: 'published', deletedAt: null },
      include: { category: true },
      orderBy: { publishedAt: 'desc' },
      take: limit,
    });
  },

  async getFeatured(limit = 10) {
    return prisma.movie.findMany({
      where: { status: 'published', isFeatured: true, deletedAt: null },
      include: { category: true },
      orderBy: { popularityScore: 'desc' },
      take: limit,
    });
  },

  async search(query, { page = 1, limit = 20, category } = {}) {
    const where = { status: 'published', deletedAt: null };

    if (query) {
      where.OR = [
        { title: { search: query } },
        { description: { search: query } },
        { shortDescription: { search: query } },
      ];
    }
    if (category) {
      where.category = { OR: [{ slug: category }, { name: category }] };
    }

    const [rows, total] = await Promise.all([
      prisma.movie.findMany({
        where,
        include: { category: true },
        orderBy: { popularityScore: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.movie.count({ where }),
    ]);

    return { rows, total };
  },

  async countByStatus(status) {
    return prisma.movie.count({
      where: { status, deletedAt: null },
    });
  },

  async countAll() {
    return prisma.movie.count({ where: { deletedAt: null } });
  },
};

module.exports = movieRepository;
