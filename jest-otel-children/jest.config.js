module.exports = {
  reporters: ['default', ['buildkite-test-collector/jest/reporter', {
    otelEnabled: true,
    otelInstrumentations: [
      '@opentelemetry/instrumentation-http', // http and https
      '@opentelemetry/instrumentation-undici', // fetch
    ],
    tags: { 'collector.mode': 'otel-children' },
  }]],
  testEnvironment: 'buildkite-test-collector/jest/environment',
  runtime: 'buildkite-test-collector/jest/runtime',
  testLocationInResults: true,
}
