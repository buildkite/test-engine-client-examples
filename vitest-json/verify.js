// Production proof only: one deliberate failure must not hide extra failures.
import assert from 'node:assert/strict';
import { readFileSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const resultPath = 'tmp/vitest-results.json';
rmSync(resultPath, { force: true });
const result = spawnSync('npm', ['test'], { stdio: 'inherit' });
assert.equal(result.status, 1, 'the deliberate failure must be the Vitest exit status');
const report = JSON.parse(readFileSync(resultPath, 'utf8'));
const tests = report.testResults.flatMap(file => file.assertionResults);
const expected = [
  ['widgets', 'parses a widget', 'passed'],
  ['widgets lookup', 'reports a missing widget', 'failed'],
  ['widgets lookup', 'skips a disabled widget', 'skipped'],
  ['widgets lookup', 'supports archived widgets', 'todo'],
  ['widgets lookup', 'skips an unavailable widget', 'skipped'],
  ['widgets disabled lookup', 'does not query widgets', 'skipped'],
];
assert.deepEqual(tests.map(test => [test.ancestorTitles.join(' '), test.title, test.status]), expected);
assert.match(tests[1].failureMessages.join('\n'), /widget lookup failed/);
console.log('JSON_PROOF', JSON.stringify({
  mode: process.env.JSON_PROOF_MODE || 'control',
  collectorVersion: require('buildkite-test-collector/package.json').version,
  runKey: process.env.BUILDKITE_ANALYTICS_KEY,
  tests: expected,
  failureReason: 'widget lookup failed',
}));
