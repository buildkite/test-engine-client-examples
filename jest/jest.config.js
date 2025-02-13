const config = {
  reporters: [
    'default',
    // Send results to Test Engine
    ['buildkite-test-collector/jest/reporter', {
      tags: {
        "test.framework.name": "jest",
        "test.framework.version": require("jest/package.json").version,
      }
    }]
  ],

  // Enable column + line capture for Test Engine
  testLocationInResults: true
};

module.exports = config;
