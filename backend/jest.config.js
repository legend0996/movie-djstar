module.exports = {
  testEnvironment: 'node',
  setupFiles: ['./src/tests/setup.js'],
  testMatch: ['**/src/tests/**/*.test.js'],
  moduleFileExtensions: ['js', 'json'],
  transform: {},
  verbose: true,
  forceExit: true,
  detectOpenHandles: true,
};
