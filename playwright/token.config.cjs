const config = require('./playwright.config');
module.exports = {
  ...config,
  reporter: config.reporter.map(entry => entry[0].includes('buildkite-test-collector')
    ? [entry[0], { ...entry[1], token: process.env.BUILDKITE_ANALYTICS_TOKEN }]
    : entry[0] === 'json' ? ['json', { outputFile: 'tmp/token-report.json' }] : entry),
};
