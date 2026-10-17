const config = require('./playwright.config')

module.exports = {
  ...config,
  reporter: [
    ['line'],
    ['buildkite-test-collector/playwright/reporter', {
      otelEnabled: true,
      tags: {
        'collector.mode': 'otel',
        'test.framework.name': 'playwright',
        'test.framework.version': require('playwright/package.json').version,
      },
    }],
  ],
}
