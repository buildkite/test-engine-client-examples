module.exports = {
  reporters: ['default', ['buildkite-test-collector/jest/reporter', {
    otelEnabled: true,
    tags: { 'collector.mode': 'otel-children' },
  }]],
  testEnvironment: 'buildkite-test-collector/jest/environment',
  setupFilesAfterEnv: ['<rootDir>/otel.setup.js'],
  testLocationInResults: true,
}
