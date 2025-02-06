const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    supportFile: false,
  },
  screenshotOnRunFailure: false,
  video: false,
  // Send results to Test Engine
  reporter: "buildkite-test-collector/cypress/reporter",
  reporterOptions: {
    token_name: "BUILDKITE_ANALYTICS_TOKEN",
    tags: {
      "test.framework.name": "cypress",
      "test.framework.version": require('cypress/package.json').version,
    },
  },
})
