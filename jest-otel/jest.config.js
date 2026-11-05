module.exports = {
  reporters: [
    'default',
    ['buildkite-test-collector/jest/reporter', { otelEnabled: true }],
  ],
  runtime: 'buildkite-test-collector/jest/runtime',
  testEnvironment: 'node',
  testLocationInResults: true,
};
