const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    supportFile: false,
  },
  screenshotOnRunFailure: false,
  video: false,
  reporter: "buildkite-test-collector/cypress/reporter",
  reporterOptions: {
    token_name: "BUILDKITE_ANALYTICS_TOKEN",
  },
})
