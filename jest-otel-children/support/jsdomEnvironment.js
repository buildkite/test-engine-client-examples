// Legacy beta.3 setup. Delete this adapter when switching to beta.4.
const { TestEnvironment } = require('jest-environment-jsdom')
module.exports = require('buildkite-test-collector/jest/environment').extend(TestEnvironment)
