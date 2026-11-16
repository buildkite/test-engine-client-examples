const config = require('../playwright.config');
const path = require('node:path');

module.exports = {
  ...config,
  testDir: path.resolve(__dirname, '../tests'),
  outputDir: path.resolve(__dirname, '../tmp/test-results'),
  webServer: [{
    ...config.webServer[0],
    cwd: path.resolve(__dirname, '..'),
    stdout: 'pipe',
    // The negative control changes only Playwright's shutdown policy. Its
    // default SIGKILL bypasses the app's SIGTERM handler and SDK shutdown.
    gracefulShutdown: process.env.APP_TRACE_NO_GRACEFUL ? undefined : config.webServer[0].gracefulShutdown,
    env: {
      ...config.webServer[0].env,
      OTEL_BSP_SCHEDULE_DELAY: '60000',
    },
  }],
};
