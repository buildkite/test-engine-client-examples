import { spawnSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'
import { verify } from './verify.mjs'
import './generate.mjs'

const mode = process.env.HARNESS_MODE || 'direct'
const pool = process.env.HARNESS_POOL || 'forks'
const size = process.env.HARNESS_SIZE || 'large'
const run = process.env.HARNESS_RUN || `${mode}-${pool}-${size}`
const dir = path.resolve('tmp', run)
mkdirSync(dir, { recursive: true })
for (const name of ['exports', 'uploads', 'proofs', 'json']) writeFileSync(`${dir}/${name}.jsonl`, '')
const resultPath = process.argv.includes('--result') ? process.argv[process.argv.indexOf('--result') + 1] : `${dir}/results.json`
const started = performance.now()
const result = spawnSync(process.execPath, ['node_modules/vitest/vitest.mjs', 'run', '--outputFile', resultPath], {
  encoding: 'utf8', maxBuffer: 128 * 1024 * 1024,
  env: { ...process.env, HARNESS_MODE: mode, HARNESS_POOL: pool, HARNESS_SIZE: size, HARNESS_RUN: run,
    HARNESS_DIR: dir, HARNESS_PROOFS: `${dir}/proofs.jsonl`, NO_COLOR: '1',
    NODE_OPTIONS: `${process.env.NODE_OPTIONS || ''} --require ${JSON.stringify(path.resolve('observe.cjs'))}`,
  },
})
const wallMs = performance.now() - started
const log = `${result.stdout || ''}\n${result.stderr || ''}`
writeFileSync(`${dir}/runner.log`, log)
// Keep every collector warning verbatim, even if verification fails afterwards.
const clean = log.replace(/\x1b\[[0-9;]*m/g, '')
const warnings = clean.split('\n').filter((line) => /\[buildkite-test-collector\]|Missing BUILDKITE_ANALYTICS_TOKEN|⚠️ Test Engine|OTEL_JSON_UPLOAD/.test(line))
writeFileSync(`${dir}/warnings.json`, JSON.stringify(warnings, null, 2))
for (const warning of warnings) console.log(warning)
assert.equal(result.status, 1, `Expected intentional failures only: ${result.error || result.signal || result.status}; see ${dir}/runner.log`)
assert.equal(warnings.length, 0, 'Collector warnings; report rather than work around')
const duration = clean.match(/Duration\s+([\d.]+)(ms|s)/)
assert.ok(duration, 'Default reporter Vitest duration is required')
const vitestMs = Number(duration[1]) * (duration[2] === 's' ? 1000 : 1)
if (resultPath !== `${dir}/results.json`) {
  const { copyFileSync } = await import('node:fs')
  copyFileSync(resultPath, `${dir}/results.json`)
}
const summary = { run, mode, pool, size, runKey: process.env.BUILDKITE_ANALYTICS_KEY,
  vitestMs, wallMs, parentPid: result.pid, warnings, ...verify(dir, mode, size, result.pid) }
writeFileSync(`${dir}/summary.json`, JSON.stringify(summary, null, 2))
for (const upload of summary.uploads) console.log('HARNESS_UPLOAD', JSON.stringify(upload))
for (const proof of summary.proofs) console.log('OTEL_PROOF', JSON.stringify(proof))
console.log('HARNESS_VERIFIED', JSON.stringify({ ...summary, proofs: undefined, uploads: undefined }))
// Preserve actual runner failure for bktec; relay.mjs accepts it only after proof.
if (mode === 'relay') process.exitCode = 1
