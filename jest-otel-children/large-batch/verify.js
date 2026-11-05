const assert = require('node:assert/strict')
const { spawnSync } = require('node:child_process')
const { mkdirSync, readFileSync, writeFileSync } = require('node:fs')
const path = require('node:path')
const directory = path.resolve(__dirname, '../tmp', process.env.OTEL_PROOF_MODE || 'large-direct')
mkdirSync(directory, { recursive: true })
const file = (name) => path.join(directory, name)
const args = process.argv.slice(2)
const resultPath = args[0] === '--result' ? args.splice(0, 2)[1] : file('results.json')
for (const name of ['exports.jsonl', 'uploads.jsonl', 'proofs.jsonl']) writeFileSync(file(name), '')
const result = spawnSync(process.execPath, [require.resolve('jest/bin/jest'),
  '--config', path.join(__dirname, 'jest.config.js'), '--maxWorkers=2',
  '--json', '--outputFile', resultPath], {
  encoding: 'utf8', maxBuffer: 20 * 1024 * 1024,
  env: { ...process.env,
    OTEL_PROOF_EXPORTS: file('exports.jsonl'), OTEL_BATCH_UPLOADS: file('uploads.jsonl'), OTEL_BATCH_PROOFS: file('proofs.jsonl'),
    NODE_OPTIONS: `${process.env.NODE_OPTIONS || ''} --require ${JSON.stringify(path.join(__dirname, 'recordUploads.js'))}`,
  },
})
process.stdout.write(result.stdout || '')
process.stderr.write(result.stderr || '')
assert.equal(result.status, 1, `Jest must report exactly the intentional failures: ${result.error || result.signal || result.status}`)
assert.doesNotMatch(`${result.stdout}\n${result.stderr}`, /\[buildkite-test-collector\]|Missing BUILDKITE_ANALYTICS_TOKEN|⚠️ Test Engine|OTEL_JSON_UPLOAD/, 'Unexpected collector warning or JSON upload')
const report = JSON.parse(readFileSync(resultPath, 'utf8'))
assert.equal(report.numRuntimeErrorTestSuites, 0)
assert.equal(report.numTotalTests, 1650)
assert.equal(report.numPassedTests, 1500)
assert.equal(report.numFailedTests, 150)
const expected = new Map([
  ...Array.from({ length: 1500 }, (_, i) => [`large batch pass ${i}`, 'pass']),
  ...Array.from({ length: 150 }, (_, i) => [`large batch fail ${i}`, 'fail']),
])
for (const test of report.testResults.flatMap((suite) => suite.assertionResults)) {
  assert.equal(test.status, expected.get(test.fullName) === 'pass' ? 'passed' : 'failed')
  assert.equal(test.invocations || 1, 1)
  if (test.status === 'failed') assert.match(test.failureMessages.join('\n'), /EXPECTED_LARGE_BATCH_FAILURE[\s\S]*漢字/)
}
const readLines = (name) => readFileSync(file(name), 'utf8').trim().split('\n').filter(Boolean).map((line) => JSON.parse(line))
const spans = readLines('exports.jsonl')
const proofs = readLines('proofs.jsonl')
assert.equal(spans.length, 1650)
assert.equal(new Set(spans.map((span) => span.spanId)).size, 1650, 'Duplicate exported roots')
assert.deepEqual(spans.map((span) => span.attributes['test.case.name']).sort(), [...expected.keys()].sort())
assert.deepEqual(proofs.map((proof) => `${proof.traceId}/${proof.spanId}`).sort(), spans.map((span) => `${span.traceId}/${span.spanId}`).sort(), 'Active roots must match exports exactly')
assert.equal(new Set(proofs.map((proof) => proof.pid)).size, 2, 'Expected two actual workers')
assert.ok(proofs.every((proof) => proof.pid !== result.pid))
for (const span of spans) {
  assert.equal(span.name, 'test.execution')
  assert.ok(!span.parentSpanId)
  assert.equal(span.exporterPid, result.pid, 'Exports must come from the Jest parent')
  assert.equal(span.attributes['test.case.result.status'], expected.get(span.attributes['test.case.name']))
  assert.equal(span.attributes['buildkite.collector.version'], '1.13.0-beta.5')
  assert.equal(span.scopeVersion, '1.13.0-beta.5')
  assert.equal(span.attributes['buildkite.run_key'], process.env.BUILDKITE_ANALYTICS_KEY)
}
const records = readLines('uploads.jsonl')
const uploads = records.filter((record) => record.type === 'upload')
assert.equal(uploads.reduce((sum, upload) => sum + upload.spans, 0), 1650)
assert.ok(uploads.some((upload) => upload.bytes >= 550 * 1024), 'Must exercise an upload near the decoded byte cap')
assert.ok(!records.some((record) => record.type === 'request-error'), 'HTTP request error')
for (const upload of uploads) {
  assert.equal(upload.pid, result.pid)
  assert.equal(upload.roots, upload.spans)
  assert.ok(upload.spans <= 1000 && upload.bytes <= 750 * 1024, 'Upload exceeds span/decoded-protobuf cap')
  const responses = records.filter((record) => record.type === 'response' && record.id === upload.id)
  assert.ok(responses.length, 'Actual HTTP response must be observed for every export')
  assert.ok(responses.every((response) => response.status >= 200 && response.status < 300), 'Every HTTP attempt must get 2xx')
  assert.deepEqual(records.filter((record) => record.type === 'result' && record.id === upload.id).map((record) => record.code), [0])
  console.log('OTEL_LARGE_UPLOAD', JSON.stringify({ ...upload, statuses: responses.map((response) => response.status) }))
}
const summary = { mode: process.env.OTEL_PROOF_MODE, runKey: process.env.BUILDKITE_ANALYTICS_KEY,
  tests: 1650, passed: 1500, failed: 150, roots: spans.length, uploads, parentPid: result.pid, workerPids: [...new Set(proofs.map((proof) => proof.pid))] }
writeFileSync(file('summary.json'), JSON.stringify(summary, null, 2))
console.log('OTEL_LARGE_VERIFIED', JSON.stringify(summary))
// Preserve the real Jest failure exit through bktec; runRelay accepts it only
// after this verifier succeeds and the relay reports zero drops.
if (process.env.OTEL_PROOF_MODE === 'large-relay') process.exitCode = 1
