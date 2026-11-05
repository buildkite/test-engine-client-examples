import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

export const lines = (dir, name) => readFileSync(`${dir}/${name}.jsonl`, 'utf8').split('\n').filter(Boolean).map(JSON.parse)

export function verify(dir, mode, size, parentPid) {
  const pass = size === 'small' ? 10 : 50
  const fail = size === 'small' ? 1 : 5
  const report = JSON.parse(readFileSync(`${dir}/results.json`, 'utf8'))
  const tests = report.testResults.flatMap((file) => file.assertionResults)
  // Expectations come from the workload contract, not the reporter's counts.
  const expected = new Map()
  for (let file = 0; file < 30; file++) {
    for (let i = 0; i < pass; i++) expected.set(`case ${file} pass ${i}`, 'passed')
    for (let i = 0; i < fail; i++) expected.set(`case ${file} fail ${i}`, 'failed')
    expected.set(`skipped suite ${file} case ${file} skip 0`, 'skipped')
  }
  assert.equal(tests.length, expected.size)
  assert.equal(new Set(tests.map((t) => t.fullName)).size, expected.size)
  for (const test of tests) {
    assert.equal(test.status, expected.get(test.fullName), test.fullName)
    if (test.status === 'failed') assert.match(test.failureMessages.join('\n'), /EXPECTED_SCALE_FAILURE[\s\S]*漢字/)
  }
  const proofs = lines(dir, 'proofs')
  assert.deepEqual(proofs.map((p) => p.name).sort(), [...expected].filter(([, s]) => s !== 'skipped').map(([n]) => n).sort())
  assert.ok(new Set(proofs.map((p) => `${p.pid}/${p.threadId}`)).size >= 2, 'Actual worker identities')
  const spans = lines(dir, 'exports')
  const requests = lines(dir, 'uploads')
  const json = lines(dir, 'json')
  if (mode === 'json') {
    assert.equal(spans.length, 0)
    const data = json.filter((r) => r.type === 'request').flatMap((r) => r.data)
    const fullName = (t) => [t.scope, t.name].filter(Boolean).join(' ')
    assert.deepEqual(data.map(fullName).sort(), [...expected.keys()].sort())
    for (const test of data) assert.equal(test.result, expected.get(fullName(test)))
    assert.equal(json.filter((r) => r.type === 'response').length, json.filter((r) => r.type === 'request').length)
    assert.ok(json.filter((r) => r.type === 'response').every((r) => r.status >= 200 && r.status < 300))
    assert.ok(!json.some((r) => r.type === 'error'))
  } else {
    assert.equal(json.length, 0, 'No JSON fallback')
    const roots = spans.filter((s) => s.name === 'test.execution')
    assert.equal(roots.length, expected.size)
    assert.equal(new Set(spans.map((s) => s.spanId)).size, spans.length)
    assert.deepEqual(roots.map((s) => s.attributes['test.case.name']).sort(), [...expected.keys()].sort())
    const byName = new Map(roots.map((s) => [s.attributes['test.case.name'], s]))
    for (const root of roots) {
      const name = root.attributes['test.case.name']
      assert.ok(!root.parentSpanId)
      assert.equal(root.exporterPid, parentPid)
      assert.equal(root.scopeVersion, '1.14.0-beta.1')
      assert.equal(root.attributes['buildkite.collector.version'], '1.14.0-beta.1')
      assert.equal(root.attributes['test.case.result.status'], { passed: 'pass', failed: 'fail', skipped: 'skipped' }[expected.get(name)])
    }
    for (const proof of proofs) {
      const root = byName.get(proof.name)
      assert.equal(proof.traceId, root.traceId, proof.name)
      if (/pass [01]$/.test(proof.name)) {
        const callback = spans.find((s) => s.traceId === root.traceId && s.scope === 'vitest' && s.name.endsWith('.callback'))
        assert.equal(proof.spanId, callback?.spanId, `${proof.name}: active callback`)
      }
    }
    for (const root of roots) verifyTree(root, spans.filter((s) => s.traceId === root.traceId))
    for (const span of spans) assert.ok(roots.some((r) => r.traceId === span.traceId), `Orphan trace ${span.name}`)
    assert.equal(requests.filter((r) => r.type === 'upload').reduce((n, r) => n + r.spans, 0), spans.length)
    assert.ok(!requests.some((r) => r.type === 'error'))
    for (const upload of requests.filter((r) => r.type === 'upload')) {
      assert.equal(upload.pid, parentPid)
      assert.ok(upload.spans <= 1000 && upload.bytes <= 750 * 1024, 'Decoded protobuf cap')
      const responses = requests.filter((r) => r.id === upload.id && r.type === 'response')
      assert.ok(responses.length > 0 && responses.every((r) => r.status >= 200 && r.status < 300))
      assert.deepEqual(requests.filter((r) => r.id === upload.id && r.type === 'result').map((r) => r.code), [0])
    }
  }
  return { executed: 30 * (pass + fail), passed: 30 * pass, failed: 30 * fail, skipped: 30,
    roots: spans.filter((s) => s.name === 'test.execution').length,
    children: spans.filter((s) => s.name !== 'test.execution').length,
    uploads: mode === 'json' ? json.filter((r) => r.type === 'request').map(({ bytes, runEnv, tags }) => ({ bytes, runEnv, tags,
      responses: json.filter((r) => r.type === 'response') })) : requests.filter((r) => r.type === 'upload'),
    proofs: mode === 'json' ? [] : proofs.filter((p) => /pass [01]$/.test(p.name)).map((proof) => {
      const tree = spans.filter((s) => s.traceId === proof.traceId)
      return { ...proof, rootSpanId: tree.find((s) => s.name === 'test.execution').spanId,
        tree: tree.map(({ spanId, parentSpanId, name, scope, kind, status }) => ({ spanId, parentSpanId, name, scope, kind, status })) }
    }),
  }
}

export function verifyTree(root, spans) {
  const byId = new Map(spans.map((s) => [s.spanId, s]))
  const children = spans.filter((s) => s.spanId !== root.spanId)
  const name = root.attributes['test.case.name']
  const rich = /pass 0$/.test(name)
  const concurrent = /pass 1$/.test(name)
  assert.equal(children.length, rich ? 12 : concurrent ? 2 : 0, `${name}: exact child count`)
  const paths = children.map((span) => {
    const parts = []
    let current = span
    const seen = new Set()
    while (current.spanId !== root.spanId) {
      assert.ok(!seen.has(current.spanId), 'Parent cycle')
      seen.add(current.spanId)
      parts.unshift(current.scope === 'vitest' ? `phase:${current.name.split('.').at(-1)}`
        : current.scope === 'vitest-scale-harness' ? current.name
        : `${current.scope.includes('undici') ? 'fetch' : 'http'}:${current.kind}`)
      current = byId.get(current.parentSpanId)
      assert.ok(current, `Missing parent of ${span.name}`)
    }
    if (span.scope === 'vitest') assert.ok(children.some((s) => s.parentSpanId === span.spanId), `Empty phase ${span.name}`)
    return parts.join('/')
  }).sort()
  const expected = rich ? [
    'phase:beforeEach', 'phase:beforeEach/hook-before',
    'phase:afterEach', 'phase:afterEach/hook-after',
    'phase:callback', 'phase:callback/body-manual',
    'phase:callback/http:2', 'phase:callback/http:2/http:1', 'phase:callback/http:2/http:1/server-handler',
    'phase:callback/fetch:2', 'phase:callback/fetch:2/http:1', 'phase:callback/fetch:2/http:1/server-handler',
  ] : concurrent ? ['phase:callback', 'phase:callback/concurrent-manual'] : []
  // Exact scope/kind/ancestry, independent of dynamic ports and HTTP span labels.
  assert.deepEqual(paths, expected.sort(), `${name}: child ancestry`)
}
