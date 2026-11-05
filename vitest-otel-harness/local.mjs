// Real collector and HTTP transport, but a local accepting receiver: this is
// not a claim that Test Engine stored these executions.
import { createServer } from 'node:http'
import { spawn } from 'node:child_process'
import { gunzipSync } from 'node:zlib'
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'
const mode = process.env.HARNESS_MODE || 'direct'
const pool = process.env.HARNESS_POOL || 'forks'
const size = process.env.HARNESS_SIZE || 'large'
const run = process.env.HARNESS_RUN || `${mode}-${pool}-${size}`
const requests = []
const server = createServer(async (req, res) => {
  const buffers = []
  for await (const data of req) buffers.push(data)
  let body = Buffer.concat(buffers)
  if (req.headers['content-encoding'] === 'gzip') body = gunzipSync(body)
  requests.push({ bytes: body.length, path: req.url, ...(mode === 'json' ? { tests: JSON.parse(body).data.length } : {}) })
  res.setHeader('Content-Type', mode === 'json' ? 'application/json' : 'application/x-protobuf')
  res.end(mode === 'json' ? '{}' : Buffer.alloc(0))
})
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
try {
  const endpoint = `http://127.0.0.1:${server.address().port}`
  const child = spawn(process.execPath, ['run.mjs'], { stdio: 'inherit', env: { ...process.env,
    HARNESS_MODE: mode, HARNESS_RUN: run,
    BUILDKITE_ANALYTICS_KEY: `local-${run}`, BUILDKITE_TEST_ENGINE_SUITE_SLUG: 'test-engine-client-examples',
    BUILDKITE_ANALYTICS_TOKEN: 'local-placeholder', BUILDKITE_TESTS_OTLP_TOKEN: 'local-placeholder',
    BUILDKITE_ANALYTICS_BASE_URL: `${endpoint}/json`, BUILDKITE_ANALYTICS_OTLP_ENDPOINT: `${endpoint}/v1/traces`,
  } })
  assert.equal(await new Promise((resolve) => child.on('exit', resolve)), 0)
  const summary = JSON.parse(readFileSync(`tmp/${run}/summary.json`))
  assert.deepEqual(requests.map((r) => r.bytes).sort((a,b) => a-b), summary.uploads.map((r) => r.bytes).sort((a,b) => a-b))
  writeFileSync(`tmp/${run}/receiver.json`, JSON.stringify(requests, null, 2))
  console.log('HARNESS_LOCAL_RECEIVER_VERIFIED', JSON.stringify({ run, requests }))
} finally { await new Promise((resolve) => server.close(resolve)) }
