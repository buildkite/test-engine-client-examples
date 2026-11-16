const { defineConfig } = require('@playwright/test');
const { appTracingEnv } = require('buildkite-test-collector/playwright/fixture');

const baseURL = `http://127.0.0.1:${process.env.PORT || 3000}`;
module.exports = defineConfig({
  testDir: './tests',
  outputDir: './tmp/test-results',
  fullyParallel: true,
  workers: 3,
  reporter: [
    ['line'],
    ['buildkite-test-collector/playwright/reporter', { otelEnabled: true }],
  ],
  use: { baseURL },
  webServer: {
    command: 'npm start',
    url: `${baseURL}/health`,
    env: appTracingEnv(),
    gracefulShutdown: { signal: 'SIGTERM', timeout: 5000 },
  },
});
