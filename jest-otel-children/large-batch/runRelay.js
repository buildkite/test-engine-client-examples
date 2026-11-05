const assert = require('node:assert/strict')
const { spawnSync } = require('node:child_process')
const { mkdirSync, writeFileSync } = require('node:fs')
const path = require('node:path')
const directory = path.resolve(__dirname, '../tmp/large-relay')
mkdirSync(directory, { recursive: true })
const result = spawnSync('bktec', ['run'], {
  encoding: 'utf8', maxBuffer: 20 * 1024 * 1024,
  env: { ...process.env, BUILDKITE_TEST_ENGINE_RESULT_PATH: path.join(directory, 'results.json') },
})
process.stdout.write(result.stdout || '')
process.stderr.write(result.stderr || '')
const log = `${result.stdout}\n${result.stderr}`
writeFileSync(path.join(directory, 'relay.log'), log)
// bktec sees the real failed Jest assertions. Only our exact expected workload
// is accepted; unexpected runner/verifier failures cannot turn the job green.
assert.equal(result.status, 1, 'bktec must report the intentional failures')
assert.match(log, /OTEL_LARGE_VERIFIED /, 'The complete export/status/size verification must pass')
assert.match(log, /bktec OTLP relay: [1-9]\d* request\(s\).*0 dropped permanently, 0 dropped at drain deadline, 0B dropped/, 'Missing zero-drop relay report')
assert.match(log, /upstream upload attempt\(s\)/, 'Relay batching must be enabled')
assert.doesNotMatch(log, /\[buildkite-test-collector\]|\b(?:413|429)\b/, 'Collector warning or relay rejection')
