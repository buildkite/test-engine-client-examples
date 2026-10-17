// Jest in OpenTelemetry mode: the reporter decides the mode, the test
// environment exports one test.execution span per test from each worker.
const config = {
  reporters: [
    'default',
    ['buildkite-test-collector/jest/reporter', {
      otelEnabled: true,
      tags: {
        "test.framework.name": "jest",
        "test.framework.version": require("jest/package.json").version,
        "collector.mode": "otel",
      }
    }]
  ],
  testEnvironment: 'buildkite-test-collector/jest/environment',

  // Enable column + line capture for Test Engine
  testLocationInResults: true
};

module.exports = config;
