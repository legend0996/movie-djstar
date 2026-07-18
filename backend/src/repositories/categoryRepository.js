const prisma = require('../config/database');
const { slugify } = require('../utils/helpers');

const categoryRepository = {
  async findById(id) {
    return prisma.category.findUnique({
      where: { id },
      include: { parent: true }
    });
  },

  async findBySlug(slug) {
    return prisma.category.findUnique({
      where: { slug },
      include: { parent: true }
    });
  },

  async create(data) {
    const slug = data.slug || slugify(data.name);
    const category = await prisma.category.create({
      data: {
        name: data.name,
        slug,
        description: data.description || null,
        parentId: data.parentId || null,
        icon: data.icon || null,
        displayOrder: data.displayOrder || 0,
        isVisible: data.isVisible !== false,
        isSeries: data.isSeries || false
      }
    });
    return category.id;
  },

  async update(id, data) {
    const allowed = ['name', 'slug', 'description', 'parentId', 'icon', 'displayOrder', 'isVisible', 'isSeries'];
    const updateData = {};
    for (const [key, value] of Object.entries(data)) {
      if (allowed.includes(key) && value !== undefined) {
        updateData[key] = value;
      }
    }
    if (Object.keys(updateData).length === 0) return false;
    await prisma.category.update({ where: { id }, data: updateData });
    return true;
  },

  async delete(id) {
    await prisma.category.updateMany({
      where: { parentId: id },
      data: { parentId: null }
    });
    await prisma.category.delete({ where: { id } });
    return true;
  },

  async findAll(visibleOnly = false) {
    const where = visibleOnly ? { isVisible: true } : {};

    const rows = await prisma.category.findMany({
      where,
      include: {
        parent: true,
        _count: {
          select: {
            movies: {
              where: { deletedAt: null, status: 'published' }
            }
          }
        }
      },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }]
    });

    return rows.map(cat => ({
      ...cat,
      movie_count: cat._count.movies
    }));
  },

  async reorder(id, displayOrder) {
    await prisma.category.update({
      where: { id },
      data: { displayOrder }
    });
    return true;
  }
};

module.exports = categoryRepository;
