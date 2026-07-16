const db = require('../config/database');
const { slugify } = require('../utils/helpers');

const categoryRepository = {
  async findById(id) {
    const [rows] = await db.execute(
      `SELECT c.*, p.name as parent_name
       FROM categories c
       LEFT JOIN categories p ON c.parent_id = p.id
       WHERE c.id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  async findBySlug(slug) {
    const [rows] = await db.execute(
      `SELECT c.*, p.name as parent_name
       FROM categories c
       LEFT JOIN categories p ON c.parent_id = p.id
       WHERE c.slug = ?`,
      [slug]
    );
    return rows[0] || null;
  },

  async create(data) {
    const slug = data.slug || slugify(data.name);
    const [result] = await db.execute(
      `INSERT INTO categories (name, slug, description, parent_id, icon, display_order, is_visible, is_series)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.name,
        slug,
        data.description || null,
        data.parentId || null,
        data.icon || null,
        data.displayOrder || 0,
        data.isVisible !== false ? 1 : 0,
        data.isSeries ? 1 : 0,
      ]
    );
    return result.insertId;
  },

  async update(id, data) {
    const updates = [];
    const values = [];

    const allowed = ['name', 'slug', 'description', 'parent_id', 'icon', 'display_order', 'is_visible', 'is_series'];
    for (const [key, value] of Object.entries(data)) {
      if (allowed.includes(key) && value !== undefined) {
        updates.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (updates.length === 0) return false;
    values.push(id);
    const [result] = await db.execute(
      `UPDATE categories SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    return result.affectedRows > 0;
  },

  async delete(id) {
    await db.execute(`UPDATE categories SET parent_id = NULL WHERE parent_id = ?`, [id]);
    const [result] = await db.execute(`DELETE FROM categories WHERE id = ?`, [id]);
    return result.affectedRows > 0;
  },

  async findAll(visibleOnly = false) {
    let where = '';
    if (visibleOnly) {
      where = 'WHERE c.is_visible = 1';
    }
    const [rows] = await db.execute(
      `SELECT c.*, p.name as parent_name,
        (SELECT COUNT(*) FROM movies WHERE category_id = c.id AND deleted_at IS NULL AND status = 'published') as movie_count
       FROM categories c
       LEFT JOIN categories p ON c.parent_id = p.id
       ${where}
       ORDER BY c.display_order ASC, c.name ASC`
    );
    return rows;
  },

  async reorder(id, newOrder) {
    const [result] = await db.execute(
      `UPDATE categories SET display_order = ? WHERE id = ?`,
      [newOrder, id]
    );
    return result.affectedRows > 0;
  },
};

module.exports = categoryRepository;
