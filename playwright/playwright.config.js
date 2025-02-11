// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config({ path: path.resolve(__dirname, '.env') });

/**
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: './tests',
  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    }
  ],
  reporter: [
    ['line'],
    // Send results to Test Engine
    ['buildkite-test-collector/playwright/reporter', {
      tags: {
        "test.framework.name": "playwright",
        "test.framework.version": require('playwright/package.json').version,
      },
    }],
    // Output results to a JSON file for Buildkite Test Engine Client to read
    ['json', { outputFile: process.env.BUILDKITE_TEST_ENGINE_RESULT_PATH }]
  ],
});

