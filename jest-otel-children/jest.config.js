module.exports = {
  reporters: ['default', ['buildkite-test-collector/jest/reporter', {
    otelEnabled: true,
    tags: { 'collector.mode': 'otel-children' },
  }]],
  testEnvironment: 'buildkite-test-collector/jest/environment',
  runtime: 'buildkite-test-collector/jest/runtime',
  testLocationInResults: true,
  // Adversarial resolver case: a valid Jest alias must still load Express.
  moduleNameMapper: { '^@fixture/express$': 'express' },
}
