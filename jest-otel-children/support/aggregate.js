const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const path = require('node:path')
const read = (job) => JSON.parse(readFileSync(path.join(__dirname, '..', 'tmp', job, 'summary.json'), 'utf8'))
const direct = read('direct-0')
const json = read('json-0')
const shards = [read('relay-0'), read('relay-1')]
assert.equal(direct.tests, 17)
assert.equal(direct.attempts, 18)
assert.deepEqual([...json.attemptNames].sort(), [...direct.attemptNames].sort(), 'JSON and OTel controls must run the same cases')
assert.deepEqual(shards.flatMap((shard) => shard.attemptNames).sort(), [...direct.attemptNames].sort(), 'Split jobs must cover every attempt exactly once')
assert.deepEqual(shards.flatMap((shard) => shard.files).sort(), [...direct.files].sort(), 'No missing or overlapping split files')
for (const shard of shards) {
  assert.ok(shard.tests > 0, 'Both shards must run tests')
  assert.equal(shard.runKey, `${process.env.BUILDKITE_BUILD_ID}-jest-otel-relay`, 'All shards must use one run key')
  assert.match(readFileSync(path.join(__dirname, '..', 'tmp', `relay-${shard.index}`, 'relay.log'), 'utf8'), /0 dropped permanently, 0 dropped at drain deadline, 0B dropped/)
}
const relayRoots = shards.flatMap((shard) => shard.proofs)
assert.equal(new Set(relayRoots.map((proof) => proof.spanId)).size, 18)
console.log('OTEL_HARNESS_COMPLETE', JSON.stringify({ tests: 17, attempts: 18, relayRunKey: shards[0].runKey, directRunKey: direct.runKey }))
console.log('OTEL_TIMING_COMPARISON', JSON.stringify({
  jsonMilliseconds: json.milliseconds,
  directMilliseconds: direct.milliseconds,
  relayWallMilliseconds: Math.max(...shards.map((shard) => shard.milliseconds)),
  relayTotalMilliseconds: shards.reduce((total, shard) => total + shard.milliseconds, 0),
  note: 'Jest + export/verification time; excludes dependency installation; split wall time is max(shards)',
}))
