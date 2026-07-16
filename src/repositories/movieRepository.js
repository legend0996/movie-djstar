const db = require('../config/database');

const movieRepository = {
  async findById(id) {
    const [rows] = await db.execute(
      `SELECT m.*, c.name as category_name, c.slug as category_slug
       FROM movies m
       LEFT JOIN categories c ON m.category_id = c.id
       WHERE m.id = ? AND m.deleted_at IS NULL`,
      [id]
    );
    return rows[0] || null;
  },

  async findBySlug(slug) {
    const [rows] = await db.execute(
      `SELECT m.*, c.name as category_name, c.slug as category_slug
       FROM movies m
       LEFT JOIN categories c ON m.category_id = c.id
       WHERE m.slug = ? AND m.deleted_at IS NULL`,
      [slug]
    );
    return rows[0] || null;
  },

  async create(data) {
    const [result] = await db.execute(
      `INSERT INTO movies (category_id, title, slug, description, short_description,
        duration, release_year, language, quality, age_rating, director, cast_members,
        price, is_free, is_featured, status, is_series, series_id, episode_number,
        season_number, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.categoryId || null,
        data.title,
        data.slug,
        data.description || null,
        data.shortDescription || null,
        data.duration || null,
        data.releaseYear || null,
        data.language || 'English',
        data.quality || 'HD',
        data.ageRating || null,
        data.director || null,
        data.castMembers ? JSON.stringify(data.castMembers) : null,
        data.price || 0,
        data.isFree ? 1 : 0,
        data.isFeatured ? 1 : 0,
        data.status || 'draft',
        data.isSeries ? 1 : 0,
        data.seriesId || null,
        data.episodeNumber || null,
        data.seasonNumber || null,
        data.createdBy || null,
      ]
    );
    return result.insertId;
  },

  async update(id, data) {
    const allowed = [
      'category_id', 'title', 'slug', 'description', 'short_description',
      'duration', 'release_year', 'language', 'quality', 'age_rating',
      'director', 'cast_members', 'poster_url', 'cover_url', 'trailer_url',
      'thumbnail_url', 'movie_url', 'movie_size', 'movie_format', 'price',
      'is_free', 'is_featured', 'status', 'is_series', 'series_id',
      'episode_number', 'season_number', 'published_at',
    ];
    const updates = [];
    const values = [];

    for (const [key, value] of Object.entries(data)) {
      if (allowed.includes(key) && value !== undefined) {
        updates.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (updates.length === 0) return false;

    values.push(id);
    const [result] = await db.execute(
      `UPDATE movies SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    return result.affectedRows > 0;
  },

  async delete(id) {
    const [result] = await db.execute(
      `UPDATE movies SET deleted_at = NOW(), status = 'archived' WHERE id = ?`,
      [id]
    );
    return result.affectedRows > 0;
  },

  async findAll({ page = 1, limit = 20, status, categoryId, isFree, search, sort = 'newest', featured } = {}) {
    const offset = (page - 1) * limit;
    let where = 'WHERE m.deleted_at IS NULL';
    const params = [];

    if (status) {
      where += ' AND m.status = ?';
      params.push(status);
    } else {
      where += " AND m.status = 'published'";
    }
    if (categoryId) {
      where += ' AND m.category_id = ?';
      params.push(categoryId);
    }
    if (isFree !== undefined) {
      where += ' AND m.is_free = ?';
      params.push(isFree ? 1 : 0);
    }
    if (featured) {
      where += ' AND m.is_featured = 1';
    }
    if (search) {
      where += ' AND (m.title LIKE ? OR m.description LIKE ? OR m.short_description LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    let orderBy = 'm.created_at DESC';
    switch (sort) {
      case 'newest': orderBy = 'm.created_at DESC'; break;
      case 'oldest': orderBy = 'm.created_at ASC'; break;
      case 'popular': orderBy = 'm.popularity_score DESC'; break;
      case 'price_asc': orderBy = 'm.price ASC'; break;
      case 'price_desc': orderBy = 'm.price DESC'; break;
      case 'title': orderBy = 'm.title ASC'; break;
      default: orderBy = 'm.created_at DESC';
    }

    const [rows] = await db.execute(
      `SELECT m.*, c.name as category_name, c.slug as category_slug
       FROM movies m
       LEFT JOIN categories c ON m.category_id = c.id
       ${where}
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [countResult] = await db.execute(
      `SELECT COUNT(*) as total FROM movies m ${where}`,
      params
    );

    return { rows, total: countResult[0].total };
  },

  async incrementViews(id) {
    await db.execute(
      `UPDATE movies SET total_views = total_views + 1 WHERE id = ?`,
      [id]
    );
  },

  async incrementPurchases(id) {
    await db.execute(
      `UPDATE movies SET total_purchases = total_purchases + 1, popularity_score = popularity_score + 10 WHERE id = ?`,
      [id]
    );
  },

  async incrementStreams(id) {
    await db.execute(
      `UPDATE movies SET total_streams = total_streams + 1, popularity_score = popularity_score + 3 WHERE id = ?`,
      [id]
    );
  },

  async incrementDownloads(id) {
    await db.execute(
      `UPDATE movies SET total_downloads = total_downloads + 1, popularity_score = popularity_score + 5 WHERE id = ?`,
      [id]
    );
  },

  async getPopular(limit = 10) {
    const [rows] = await db.execute(
      `SELECT m.*, c.name as category_name, c.slug as category_slug
       FROM movies m
       LEFT JOIN categories c ON m.category_id = c.id
       WHERE m.status = 'published' AND m.deleted_at IS NULL
       ORDER BY m.popularity_score DESC
       LIMIT ?`,
      [limit]
    );
    return rows;
  },

  async getRecent(limit = 10) {
    const [rows] = await db.execute(
      `SELECT m.*, c.name as category_name, c.slug as category_slug
       FROM movies m
       LEFT JOIN categories c ON m.category_id = c.id
       WHERE m.status = 'published' AND m.deleted_at IS NULL
       ORDER BY m.published_at DESC
       LIMIT ?`,
      [limit]
    );
    return rows;
  },

  async getFeatured(limit = 10) {
    const [rows] = await db.execute(
      `SELECT m.*, c.name as category_name, c.slug as category_slug
       FROM movies m
       LEFT JOIN categories c ON m.category_id = c.id
       WHERE m.status = 'published' AND m.is_featured = 1 AND m.deleted_at IS NULL
       ORDER BY m.popularity_score DESC
       LIMIT ?`,
      [limit]
    );
    return rows;
  },

  async search(query, { page = 1, limit = 20, category } = {}) {
    const offset = (page - 1) * limit;
    let where = "WHERE m.status = 'published' AND m.deleted_at IS NULL";
    const params = [];

    if (query) {
      where += ' AND (MATCH(m.title, m.description, m.short_description) AGAINST(? IN BOOLEAN MODE) OR m.title LIKE ?)';
      params.push(`*${query}*`, `%${query}%`);
    }
    if (category) {
      where += ' AND (c.slug = ? OR c.name = ?)';
      params.push(category, category);
    }

    const [rows] = await db.execute(
      `SELECT m.*, c.name as category_name, c.slug as category_slug
       FROM movies m
       LEFT JOIN categories c ON m.category_id = c.id
       ${where}
       ORDER BY m.popularity_score DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [countResult] = await db.execute(
      `SELECT COUNT(*) as total FROM movies m LEFT JOIN categories c ON m.category_id = c.id ${where}`,
      params
    );

    return { rows, total: countResult[0].total };
  },

  async countByStatus(status) {
    const [rows] = await db.execute(
      `SELECT COUNT(*) as count FROM movies WHERE status = ? AND deleted_at IS NULL`,
      [status]
    );
    return rows[0].count;
  },

  async countAll() {
    const [rows] = await db.execute(
      `SELECT COUNT(*) as count FROM movies WHERE deleted_at IS NULL`
    );
    return rows[0].count;
  },
};

module.exports = movieRepository;
