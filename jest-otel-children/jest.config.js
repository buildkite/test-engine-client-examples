// beta.3 compatibility only. For beta.4 these become node/jsdom/@happy-dom/jest-environment.
const otel = process.env.OTEL_PROOF_MODE !== 'json'
const project = (displayName, testMatch, testEnvironment) => ({
  displayName,
  testMatch,
  testEnvironment,
  ...(otel && { runtime: 'buildkite-test-collector/jest/runtime' }),
  testLocationInResults: true,
  moduleNameMapper: { '^@fixture/express$': 'express' },
})

module.exports = {
  reporters: ['default', ['buildkite-test-collector/jest/reporter', {
    otelEnabled: otel,
    tags: { 'collector.mode': 'otel-children' },
  }]],
  projects: [
    project('node', ['<rootDir>/*.test.js', '<rootDir>/*.case.js'], otel ? 'buildkite-test-collector/jest/environment' : 'node'),
    project('jsdom', ['<rootDir>/jsdom/*.test.js'], otel ? '<rootDir>/support/jsdomEnvironment.js' : 'jsdom'),
    project('happy-dom', ['<rootDir>/happy-dom/*.test.js'], otel ? '<rootDir>/support/happyEnvironment.js' : '@happy-dom/jest-environment'),
  ],
  testSequencer: '<rootDir>/support/sequencer.js',
  testLocationInResults: true,
}
