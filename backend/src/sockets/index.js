const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const config = require('../config');
const logger = require('../utils/logger');

let io = null;

const connectedUsers = new Map();

function initializeSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: config.cors.origin,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, config.jwt.secret, {
        issuer: config.jwt.issuer,
      });
      socket.userId = decoded.sub;
      socket.userRole = decoded.role;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;
    connectedUsers.set(userId, socket.id);
    logger.debug('Socket connected', { userId, socketId: socket.id });

    socket.join(`user:${userId}`);

    if (socket.userRole === 'developer' || socket.userRole === 'movie_owner') {
      socket.join('staff');
    }

    socket.on('disconnect', () => {
      connectedUsers.delete(userId);
      logger.debug('Socket disconnected', { userId, socketId: socket.id });
    });

    socket.on('join', (room) => {
      socket.join(room);
    });

    socket.on('leave', (room) => {
      socket.leave(room);
    });
  });

  logger.info('WebSocket server initialized');
  return io;
}

function getIO() {
  if (!io) {
    throw new Error('Socket.io not initialized. Call initializeSocket() first.');
  }
  return io;
}

function sendToUser(userId, event, data) {
  if (!io) return false;
  io.to(`user:${userId}`).emit(event, data);
  return true;
}

function sendToStaff(event, data) {
  if (!io) return false;
  io.to('staff').emit(event, data);
  return true;
}

function broadcast(event, data) {
  if (!io) return false;
  io.emit(event, data);
  return true;
}

function getConnectedUsersCount() {
  return connectedUsers.size;
}

module.exports = {
  initializeSocket,
  getIO,
  sendToUser,
  sendToStaff,
  broadcast,
  getConnectedUsersCount,
};
