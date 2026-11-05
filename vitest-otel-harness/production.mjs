import { spawnSync } from 'node:child_process'
import assert from 'node:assert/strict'
const jobStarted = performance.now()
// Keep all three modes and paired runs on one agent, sequentially.
const token = () => {
  const result = spawnSync('buildkite-agent', ['oidc', 'request-token', '--audience',
    'https://buildkite.com/organizations/buildkite/analytics/suites/test-engine-client-examples', '--lifetime', '1800'], { encoding: 'utf8' })
  assert.equal(result.status, 0, 'Suite OIDC token')
  return result.stdout.trim()
}
const run = (script, env) => {
  const result = spawnSync(process.execPath, [script], { stdio: 'inherit', env: { ...process.env, ...env } })
  assert.equal(result.status, 0, script)
}
for (const mode of ['json', 'direct', 'relay']) {
  const credential = mode === 'relay' ? '' : token()
  run(mode === 'relay' ? 'relay.mjs' : 'run.mjs', {
    HARNESS_MODE: mode, HARNESS_RUN: `${mode}-forks-large`, HARNESS_POOL: 'forks', HARNESS_SIZE: 'large',
    BUILDKITE_ANALYTICS_KEY: `${process.env.BUILDKITE_BUILD_ID}-vitest-scale-${mode}`,
    BUILDKITE_ANALYTICS_TOKEN: mode === 'json' ? credential : '',
    BUILDKITE_TESTS_OTLP_TOKEN: mode === 'direct' ? credential : '',
    BUILDKITE_TEST_ENGINE_API_ACCESS_TOKEN: '',
  })
}
const credential = token()
run('performance.mjs', { BUILDKITE_ANALYTICS_TOKEN: credential, BUILDKITE_TESTS_OTLP_TOKEN: credential,
  BUILDKITE_TEST_ENGINE_API_ACCESS_TOKEN: '' })
console.log('HARNESS_JOB_WALL', JSON.stringify({ measuredMs: performance.now() - jobStarted,
  includes: 'JSON, direct, relay, 24 paired performance runs; excludes dependency installation' }))
