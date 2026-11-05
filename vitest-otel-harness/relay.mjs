import { spawnSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import assert from 'node:assert/strict'
mkdirSync('tmp', { recursive: true })
assert.match(spawnSync('bktec', ['--version'], { encoding: 'utf8' }).stdout, /3\.5\.0/)
const result = spawnSync('bktec', ['run'], { encoding: 'utf8', maxBuffer: 128 * 1024 * 1024 })
const log = `${result.stdout}\n${result.stderr}`
writeFileSync('tmp/relay.log', log)
process.stdout.write(log)
assert.equal(result.status, 1, 'Real intentional Vitest failures must reach bktec')
assert.match(log, /HARNESS_VERIFIED /, 'Full export verification required')
assert.match(log, /bktec OTLP relay: [1-9]\d* request\(s\).*0 dropped permanently, 0 dropped at drain deadline, 0B dropped/)
assert.match(log, /upstream upload attempt\(s\)/)
assert.doesNotMatch(log, /\[buildkite-test-collector\]|\b(?:413|429)\b/)
