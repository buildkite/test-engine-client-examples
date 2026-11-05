import { spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import assert from 'node:assert/strict'
const rows = []
const jobStarted = performance.now()
// Both pools/modes/sizes share this one agent. Alternate order to reduce
// warm-cache/order bias; three pairs, not unrelated CI job timings.
for (const pool of ['forks', 'threads']) for (let pair = 0; pair < 3; pair++) {
  for (const size of pair % 2 ? ['large', 'small'] : ['small', 'large']) {
    for (const mode of pair % 2 ? ['direct', 'json'] : ['json', 'direct']) {
      const run = `perf-${pool}-${size}-${pair}-${mode}`
      const wallStarted = performance.now()
      const result = spawnSync(process.execPath, ['run.mjs'], { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024,
        env: { ...process.env, HARNESS_MODE: mode, HARNESS_POOL: pool, HARNESS_SIZE: size, HARNESS_RUN: run,
          BUILDKITE_ANALYTICS_KEY: `${process.env.BUILDKITE_BUILD_ID || 'local'}-${run}` } })
      process.stdout.write(result.stdout || '')
      process.stderr.write(result.stderr || '')
      assert.equal(result.status, 0, run)
      const summary = JSON.parse(readFileSync(`tmp/${run}/summary.json`))
      rows.push({ run, pool, size, pair, mode, vitestMs: summary.vitestMs,
        runnerWallMs: summary.wallMs, jobSegmentWallMs: performance.now() - wallStarted })
    }
  }
}
const median = (numbers) => numbers.sort((a,b) => a-b)[Math.floor(numbers.length / 2)]
const table = []
for (const pool of ['forks', 'threads']) for (const metric of ['vitestMs', 'runnerWallMs', 'jobSegmentWallMs']) {
  const get = (mode, size) => median(rows.filter((r) => r.mode === mode && r.pool === pool && r.size === size).map((r) => r[metric]))
  const smallDelta = get('direct', 'small') - get('json', 'small')
  const largeDelta = get('direct', 'large') - get('json', 'large')
  const perTestMs = (largeDelta - smallDelta) / (1650 - 330)
  table.push({ pool, metric, jsonSmall: get('json', 'small'), otelSmall: get('direct', 'small'),
    jsonLarge: get('json', 'large'), otelLarge: get('direct', 'large'), perTestMs,
    fixedMs: smallDelta - 330 * perTestMs })
}
mkdirSync('tmp', { recursive: true })
const report = { agent: process.env.BUILDKITE_AGENT_ID, node: process.version,
  jobWallMs: performance.now() - jobStarted, rows, table }
writeFileSync('tmp/performance.json', JSON.stringify(report, null, 2))
console.log('HARNESS_PERFORMANCE', JSON.stringify(report))
