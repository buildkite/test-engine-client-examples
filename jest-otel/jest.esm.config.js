// Jest 30 native ESM run for the require(esm) verification step.
module.exports = {
  ...require('./jest.config.js'),
  testPathIgnorePatterns: ['/node_modules/'],
  transform: {},
};
