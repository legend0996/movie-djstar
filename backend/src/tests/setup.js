process.env.NODE_ENV = 'test';

require('dotenv').config({ path: require('path').resolve(__dirname, '../../test.env') });

jest.setTimeout(30000);

const mockPrisma = {};
const prismaHandler = {
  get: function (target, prop) {
    if (!target[prop]) {
      target[prop] = {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        upsert: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
        count: jest.fn(),
        aggregate: jest.fn(),
      };
    }
    return target[prop];
  },
};
const mockPrismaClient = new Proxy(mockPrisma, prismaHandler);
mockPrismaClient.$connect = jest.fn().mockResolvedValue();
mockPrismaClient.$disconnect = jest.fn().mockResolvedValue();
mockPrismaClient.execute = jest.fn().mockResolvedValue([[]]);
mockPrismaClient.query = jest.fn().mockResolvedValue([[]]);

jest.mock('../config/database', () => mockPrismaClient);

jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  auditLogger: { warn: jest.fn(), info: jest.fn(), error: jest.fn() },
  paymentLogger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

jest.mock('../middleware/activityLogger', () => ({
  logActivity: jest.fn().mockResolvedValue(undefined),
  activityMiddleware: jest.fn(() => (req, res, next) => next()),
}));

jest.mock('../repositories/userRepository');
jest.mock('../repositories/movieRepository');
jest.mock('../repositories/categoryRepository');
jest.mock('../repositories/libraryRepository');
jest.mock('../repositories/orderRepository');
jest.mock('../repositories/transactionRepository');
jest.mock('../repositories/notificationRepository');
jest.mock('../repositories/supportRepository');
jest.mock('../repositories/roleRepository');
jest.mock('../repositories/reviewRepository', () => ({
  findById: jest.fn(),
  findByUserAndMovie: jest.fn(),
  findByMovie: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  getMovieStats: jest.fn().mockResolvedValue({ averageRating: 0, reviewCount: 0 }),
  getMoviesStats: jest.fn().mockResolvedValue({}),
  getUserReviewStats: jest.fn().mockResolvedValue({ totalReviews: 0, averageRating: 0 }),
}));
jest.mock('../services/adminService');
jest.mock('../services/emailService');
jest.mock('../services/r2Service');
jest.mock('../services/mpesaService');
jest.mock('../services/notificationService');

