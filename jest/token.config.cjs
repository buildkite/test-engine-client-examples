const config = require('./jest.config');
module.exports = {
  ...config,
  reporters: [...config.reporters.map(entry => Array.isArray(entry)
    ? [entry[0], { ...entry[1], token: process.env.BUILDKITE_ANALYTICS_TOKEN }]
    : entry), require.resolve('../bin/config-snapshot.cjs')],
};
