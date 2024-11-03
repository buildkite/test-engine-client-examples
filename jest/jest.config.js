const config = {
  reporters: [
    'default',
    // Send results to Test Engine
    'buildkite-test-collector/jest/reporter'
  ],

  // Enable column + line capture for Test Engine
  testLocationInResults: true
};

module.exports = config;
