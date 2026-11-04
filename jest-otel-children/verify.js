const assert = require('node:assert/strict')
const { mkdirSync, readdirSync, readFileSync, writeFileSync } = require('node:fs')
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
  'pg connect and query': ['test > pg:pg.connect', 'test > pg:pg.query:SELECT fixture'],
  'nock intercepted request': [client],
  'plain file after nock': [client, server],
  'blocked by beforeAll': [],
}
for (const name of ['parameterized 2', 'parameterized 7', 'retry fails once then passes', 'concurrent left', 'concurrent right']) {
  expected[name] = ['test > examples:lifecycle']
}
for (const environment of ['jsdom', 'happy-dom']) {
  expected[`${environment} React fetch and manual span`] = [
    'test > examples:component interaction',
    'test > examples:component interaction > http:2',
    'test > examples:component interaction > http:2 > http:1',
  ]
}

const mode = process.env.OTEL_PROOF_MODE || 'direct'
const index = process.env.BUILDKITE_PARALLEL_JOB || '0'
const directory = path.join(__dirname, 'tmp', `${mode}-${index}`)
mkdirSync(directory, { recursive: true })
const exportsFile = path.join(directory, 'exports.jsonl')
writeFileSync(exportsFile, '')
const args = process.argv.slice(2)
const resultPath = args[0] === '--result' ? args.splice(0, 2)[1] : path.join(directory, 'results.json')
const files = args.length ? args.map((file) => path.resolve(file)) : [__dirname, ...['jsdom', 'happy-dom'].map((dir) => path.join(__dirname, dir))]
  .flatMap((dir) => readdirSync(dir).filter((file) => file.endsWith('.test.js')).map((file) => path.join(dir, file)))
if (files.some((file) => file.endsWith('/nock.test.js'))) files.push(path.join(__dirname, 'plain.case.js'))
const proofs = []
const assertions = []
const started = performance.now()
const invoke = (selected, outputFile, expectedExit) => {
  const result = spawnSync(process.execPath, [require.resolve('jest/bin/jest'), '--runInBand', '--runTestsByPath', ...selected, '--json', '--outputFile', outputFile], {
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
  assert.equal(result.status, expectedExit, `Jest failed: ${result.error || result.signal || result.status}`)
  const log = `${result.stdout}\n${result.stderr}`
  assert.doesNotMatch(log, /\[buildkite-test-collector\]|Missing BUILDKITE_ANALYTICS_TOKEN|⚠️ Test Engine/, 'Unexpected collector warning or upload failure')
  proofs.push(...[...log.matchAll(/\bOTEL_PROOF (\{[^\r\n]+\})/g)].map((match) => JSON.parse(match[1])))
  const report = JSON.parse(readFileSync(outputFile, 'utf8'))
  assert.equal(report.numRuntimeErrorTestSuites, 0, 'Unexpected suite load failure')
  for (const file of report.testResults) assertions.push(...file.assertionResults)
  return report
}
const report = invoke(files, resultPath, 0)
assert.equal(report.numFailedTests, 0)
// Keep the intentional hook failure outside bktec's passing result report.
// It is still exported, counted and checked, not hidden by soft_fail.
if (files.some((file) => file.endsWith('/lifecycle.test.js'))) {
  const hook = invoke([path.join(__dirname, 'hook.case.js')], path.join(directory, 'hook-results.json'), 1)
  assert.equal(hook.numFailedTests, 1)
  assert.match(hook.testResults[0].assertionResults[0].failureMessages.join('\n'), /EXPECTED_BEFORE_ALL_FAILURE/)
}
const attempts = assertions.flatMap((test) => Array(test.invocations || 1).fill(test.fullName))
assert.ok(attempts.length, 'No tests ran')
for (const test of assertions) {
  assert.ok(expected[test.fullName], `Unexpected test ${test.fullName}`)
  assert.equal(test.invocations || 1, test.fullName === 'retry fails once then passes' ? 2 : 1, `${test.fullName}: unexpected attempt count`)
}
if (mode === 'json') {
  assert.equal(readFileSync(exportsFile, 'utf8'), '', 'JSON control must not export OTel spans')
} else {
  assert.deepEqual(proofs.map((proof) => proof.test).sort(), attempts.filter((name) => name !== 'blocked by beforeAll').sort(), 'Missing/duplicate active roots')
  const nockIndex = proofs.findIndex((proof) => proof.test === 'nock intercepted request')
  if (nockIndex !== -1) {
    assert.equal(proofs[nockIndex + 1]?.test, 'plain file after nock', 'Plain file must immediately follow nock')
    assert.equal(proofs[nockIndex + 1].pid, proofs[nockIndex].pid, 'Nock and plain files must share a worker')
  }
  const spans = readFileSync(exportsFile, 'utf8').trim().split('\n').map((line) => JSON.parse(line))
  assert.equal(spans.length, attempts.reduce((count, name) => count + expected[name].length + 1, 0), 'Unexpected exported spans')
  assert.equal(new Set(spans.map((span) => span.spanId)).size, spans.length, 'Duplicate exported span IDs')
  const roots = spans.filter((span) => span.name === 'test.execution')
  assert.deepEqual(roots.map((span) => span.attributes['test.case.name']).sort(), [...attempts].sort(), 'One root required per Jest attempt')
  const retry = roots.filter((span) => span.attributes['test.case.name'] === 'retry fails once then passes')
  if (retry.length) assert.deepEqual(retry.map((span) => span.attributes['test.case.result.status']).sort(), ['fail', 'pass'])
  for (const root of roots.filter((span) => span.attributes['test.case.name'] !== 'retry fails once then passes')) {
    assert.equal(root.attributes['test.case.result.status'], root.attributes['test.case.name'] === 'blocked by beforeAll' ? 'fail' : 'pass')
  }
  const hookRoot = roots.find((span) => span.attributes['test.case.name'] === 'blocked by beforeAll')
  if (hookRoot) {
    assert.equal(hookRoot.attributes['test.case.result.status'], 'fail')
    proofs.push({ test: 'blocked by beforeAll', traceId: hookRoot.traceId, spanId: hookRoot.spanId })
    console.log('OTEL_PROOF', JSON.stringify(proofs.at(-1)))
  }
  assert.deepEqual(proofs.map((proof) => proof.spanId).sort(), roots.map((span) => span.spanId).sort(), 'Proofs must cover distinct attempt roots exactly once')
  for (const proof of proofs) {
    const trace = spans.filter((span) => span.traceId === proof.traceId)
    const byId = new Map(trace.map((span) => [span.spanId, span]))
    assert.equal(byId.size, trace.length, `${proof.test}: duplicate exports`)
    assert.equal(byId.get(proof.spanId)?.name, 'test.execution', `${proof.test}: exported root must match OTEL_PROOF`)
    assert.equal(byId.get(proof.spanId)?.attributes['test.case.name'], proof.test)
    assert.equal(byId.get(proof.spanId)?.attributes['buildkite.run_key'], process.env.BUILDKITE_ANALYTICS_KEY)
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
}
const summary = { mode, index, runKey: process.env.BUILDKITE_ANALYTICS_KEY, files: files.map((file) => path.relative(__dirname, file)), tests: assertions.length, attempts: attempts.length, attemptNames: attempts, milliseconds: Math.round(performance.now() - started), proofs }
writeFileSync(path.join(directory, 'summary.json'), JSON.stringify(summary, null, 2))
console.log('OTEL_HARNESS_TIMING', JSON.stringify({ mode, index, tests: summary.tests, attempts: summary.attempts, milliseconds: summary.milliseconds }))
