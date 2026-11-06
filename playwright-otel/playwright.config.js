const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  outputDir: './tmp/test-results',
  reporter: [
    ['line'],
    ['buildkite-test-collector/playwright/reporter', {
      otelEnabled: true,
      tags: { 'collector.mode': 'otel' },
    }],
  ],
});
