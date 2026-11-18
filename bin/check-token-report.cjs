const assert = require('node:assert/strict');
const fs = require('node:fs');
const report = fs.readFileSync(process.argv[2], 'utf8');
assert.ok(process.env.BUILDKITE_ANALYTICS_TOKEN, 'A real upload token must be configured');
assert.ok(!report.includes(process.env.BUILDKITE_ANALYTICS_TOKEN), 'Reporter token leaked');
const json = JSON.parse(report);
assert.ok((json.numTotalTests || json.suites?.length) > 0, 'Report must contain results');
if (process.argv[3]) {
  const config = fs.readFileSync(process.argv[3], 'utf8');
  assert.ok(!config.includes(process.env.BUILDKITE_ANALYTICS_TOKEN), 'Serialized config leaked token');
  const reporters = JSON.parse(config).reporters;
  assert.ok(reporters.some(entry => entry[0].includes('buildkite-test-collector')));
  console.log('Serialized Jest config contains the reporter but not its token');
}
console.log('JSON report contains test results and does not contain the reporter token');
