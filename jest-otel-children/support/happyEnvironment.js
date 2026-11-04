// Legacy beta.3 setup. Delete this adapter when switching to beta.4.
const { default: HappyEnvironment } = require('@happy-dom/jest-environment')
module.exports = require('buildkite-test-collector/jest/environment').extend(HappyEnvironment)
