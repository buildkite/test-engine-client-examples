const assert = require('node:assert/strict');
const fs = require('node:fs');
const report = JSON.parse(fs.readFileSync('tmp/vitest-results.json', 'utf8'));
assert.equal(report.numTotalTests, 8);
assert.equal(report.numPassedTests, 7);
assert.equal(report.numFailedTests, 1);
const failures = report.testResults.flatMap(file => file.assertionResults).filter(test => test.status === 'failed');
assert.deepEqual(failures.map(test => test.title), ['esm failure after I/O']);
console.log('All 7 passing tests and the deliberate failure retained their outcomes');
