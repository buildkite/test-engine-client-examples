module.exports = {
  rootDir: '..',
  testMatch: ['<rootDir>/large-batch/*.test.js'],
  runtime: 'buildkite-test-collector/jest/runtime',
  testLocationInResults: true,
  // Omit Jest's default reporter so expected large failures don't flood CI logs.
  reporters: [['buildkite-test-collector/jest/reporter', {
    otelEnabled: true,
    tags: { 'large-batch.build': process.env.BUILDKITE_BUILD_ID || 'local', 'large-batch.mode': process.env.OTEL_PROOF_MODE },
  }]],
}
