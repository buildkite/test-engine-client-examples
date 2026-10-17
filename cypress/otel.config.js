const config = require('./cypress.config')

module.exports = {
  ...config,
  reporterOptions: {
    ...config.reporterOptions,
    otelEnabled: true,
    tags: { ...config.reporterOptions.tags, 'collector.mode': 'otel' },
  },
}
