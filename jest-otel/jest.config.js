module.exports = {
  reporters: [
    'default',
    ['buildkite-test-collector/jest/reporter', { otelEnabled: true }],
  ],
  runtime: 'buildkite-test-collector/jest/runtime',
  testEnvironment: 'node',
  testLocationInResults: true,
  // Jest 29 cannot require ES modules; jest.esm.config.js runs these on Jest 30.
  testPathIgnorePatterns: ['/node_modules/', '/esm/'],
};
