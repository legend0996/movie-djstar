const { PrismaClient } = require('@prisma/client');
const config = require('./index');

const databaseUrl = process.env.DATABASE_URL
  || `mysql://${config.db.user}:${config.db.password}@${config.db.host}:${config.db.port}/${config.db.name}`;

const prisma = new PrismaClient({
  log: config.isDev
    ? ['query', 'info', 'warn', 'error']
    : config.isTest
      ? []
      : ['error'],
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

prisma.$connect()
  .then(() => {
    console.log('Prisma connected to database successfully');
  })
  .catch((err) => {
    console.error('Prisma database connection failed:', err.message);
    process.exit(1);
  });

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

async function execute(sql, params = []) {
  const result = await prisma.$executeRawUnsafe(sql, ...params);
  return [{ affectedRows: result }];
}

async function query(sql, params = []) {
  const result = await prisma.$queryRawUnsafe(sql, ...params);
  return [result];
}

prisma.execute = execute;
prisma.query = query;

module.exports = prisma;
