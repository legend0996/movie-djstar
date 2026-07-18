const prisma = require('../config/database');

const userRepository = {
  async findById(id) {
    return prisma.user.findUnique({
      where: { id },
      include: { role: true }
    });
  },

  async findByUsername(username) {
    return prisma.user.findFirst({
      where: { username, deletedAt: null },
      include: { role: true }
    });
  },

  async findByEmail(email) {
    return prisma.user.findFirst({
      where: { email, deletedAt: null },
      include: { role: true }
    });
  },

  async findByPhone(phone) {
    return prisma.user.findFirst({
      where: { phone, deletedAt: null },
      include: { role: true }
    });
  },

  async create(data) {
    const user = await prisma.user.create({
      data: {
        username: data.username,
        email: data.email,
        phone: data.phone || null,
        passwordHash: data.passwordHash,
        firstName: data.firstName || null,
        lastName: data.lastName || null,
        roleId: data.roleId,
        status: 'unverified'
      }
    });
    return user.id;
  },

  async update(id, fields) {
    const allowed = [
      'firstName', 'lastName', 'phone', 'avatarUrl', 'status',
      'emailVerifiedAt', 'lastLoginAt', 'lastLoginIp', 'loginAttempts',
      'lockedUntil', 'passwordHash', 'passwordChangedAt', 'email'
    ];
    const data = {};
    for (const [key, value] of Object.entries(fields)) {
      if (allowed.includes(key) && value !== undefined) {
        data[key] = value;
      }
    }
    if (Object.keys(data).length === 0) return false;
    await prisma.user.update({ where: { id }, data });
    return true;
  },

  async softDelete(id) {
    await prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'deleted' }
    });
    return true;
  },

  async incrementLoginAttempts(id) {
    await prisma.user.update({
      where: { id },
      data: { loginAttempts: { increment: 1 } }
    });
  },

  async resetLoginAttempts(id) {
    await prisma.user.update({
      where: { id },
      data: { loginAttempts: 0, lockedUntil: null }
    });
  },

  async lockAccount(id, until) {
    await prisma.user.update({
      where: { id },
      data: { lockedUntil: until }
    });
  },

  async countByStatus(status) {
    return prisma.user.count({
      where: { status, deletedAt: null }
    });
  },

  async countAll() {
    return prisma.user.count({ where: { deletedAt: null } });
  },

  async findAll(page = 1, limit = 20, filters = {}) {
    const where = { deletedAt: null };

    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.role) {
      where.role = { slug: filters.role };
    }
    if (filters.search) {
      where.OR = [
        { username: { contains: filters.search } },
        { email: { contains: filters.search } },
        { firstName: { contains: filters.search } },
        { lastName: { contains: filters.search } }
      ];
    }

    const [rows, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: { role: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.user.count({ where })
    ]);

    return { rows, total };
  },

  async findRecent(days = 7) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    return prisma.user.count({
      where: { createdAt: { gte: since }, deletedAt: null }
    });
  }
};

module.exports = userRepository;
