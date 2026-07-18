const prisma = require('../config/database');

const roleRepository = {
  async findBySlug(slug) {
    return prisma.role.findUnique({ where: { slug } });
  },

  async findById(id) {
    return prisma.role.findUnique({ where: { id } });
  },

  async findAll() {
    return prisma.role.findMany();
  },
};

module.exports = roleRepository;
