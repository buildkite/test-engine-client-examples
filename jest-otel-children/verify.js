const assert = require('node:assert/strict')
const { mkdtempSync, readFileSync, rmSync } = require('node:fs')
const { tmpdir } = require('node:os')
const path = require('node:path')
const { spawnSync } = require('node:child_process')

// Complete child paths, excluding the test.execution root. HTTP/undici are
// identified by kind (CLIENT=2, SERVER=1); package/manual operations by name.
const client = 'test > http:2'
const server = `${client} > http:1`
const express = (route) => [client, server, ...[
  'middleware - query', 'middleware - expressInit', `request handler - ${route}`,
].map((name) => `${server} > express:${name}`)]
const expected = {
  'Express route registered at file load': express('/package'),
  'Express loaded through Jest moduleNameMapper': express('/alias'),
  'GraphQL async resolver': [
    'test > graphql:graphql.parse',
    'test > graphql:graphql.validate',
    'test > graphql:query',
    'test > graphql:query > graphql:graphql.resolve message',
  ],
  'Redis connect SET GET': ['redis-connect', 'redis-SET', 'redis-GET'].map((name) => `test > redis:${name}`),
  'HTTP I/O inside a manual span': [
    'test > examples:manual request',
    'test > examples:manual request > http:2',
    'test > examples:manual request > http:2 > http:1',
  ],
  'fetch I/O': ['test > undici:2', 'test > undici:2 > http:1'],
}

const directory = mkdtempSync(path.join(tmpdir(), 'jest-otel-proof-'))
try {
  const exportsFile = path.join(directory, 'exports.jsonl')
  const result = spawnSync(process.execPath, [require.resolve('jest/bin/jest'), '--runInBand'], {
    cwd: __dirname,
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
    env: {
      ...process.env,
      OTEL_PROOF_EXPORTS: exportsFile,
      NODE_OPTIONS: `${process.env.NODE_OPTIONS || ''} --require ${JSON.stringify(path.join(__dirname, 'support/recordExports.js'))}`,
    },
  })
  process.stdout.write(result.stdout || '')
  process.stderr.write(result.stderr || '')
  assert.equal(result.status, 0, `Jest failed: ${result.error || result.signal || result.status}`)

  const proofs = [...`${result.stdout}\n${result.stderr}`.matchAll(/\bOTEL_PROOF (\{[^\r\n]+\})/g)].map((match) => JSON.parse(match[1]))
  assert.deepEqual(proofs.map((proof) => proof.test).sort(), Object.keys(expected).sort(), 'Expected all six proof roots')
  const spans = readFileSync(exportsFile, 'utf8').trim().split('\n').map((line) => JSON.parse(line))
  assert.equal(spans.length, Object.values(expected).reduce((count, children) => count + children.length + 1, 0), 'Unexpected exported spans')
  for (const proof of proofs) {
    const trace = spans.filter((span) => span.traceId === proof.traceId)
    const byId = new Map(trace.map((span) => [span.spanId, span]))
    assert.equal(byId.size, trace.length, `${proof.test}: duplicate exports`)
    assert.equal(byId.get(proof.spanId)?.name, 'test.execution', `${proof.test}: exported root must match OTEL_PROOF`)
    const childPath = (span, depth = 0) => {
      assert.ok(span && depth < trace.length, `${proof.test}: missing parent or cycle`)
      if (span.spanId === proof.spanId) {
        assert.ok(!span.parentSpanId, `${proof.test}: test root has a parent`)
        return 'test'
      }
      const scope = span.scope.replace('@opentelemetry/instrumentation-', '')
      const operation = ['http', 'undici'].includes(scope) ? span.kind : span.name
      return `${childPath(byId.get(span.parentSpanId), depth + 1)} > ${scope}:${operation}`
    }
    const children = trace.filter((span) => span.spanId !== proof.spanId).map((span) => childPath(span))
    assert.deepEqual(children.sort(), [...expected[proof.test]].sort(), `${proof.test}: missing, extra or misparented children`)
    console.log('OTEL_EXPORT_VERIFIED', JSON.stringify({ test: proof.test, traceId: proof.traceId, rootSpanId: proof.spanId, children: children.length }))
  }
} finally {
  rmSync(directory, { recursive: true, force: true })
}
