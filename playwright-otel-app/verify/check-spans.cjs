const assert = require('node:assert/strict');

// Expectations come from the three user flows, not from the captured spans.
const cases = [
  { name: 'design team creates and lists tasks', project: 'design', http: 8, queries: 6,
    titles: ['Review checkout accessibility', 'Publish component guidelines'] },
  { name: 'operations API creates and lists a task', project: 'operations', http: 2, queries: 2,
    titles: ['Rotate staging credentials'] },
  { name: 'finance team loads a deliberately slow report', project: 'finance', http: 5, queries: 5,
    titles: ['Reconcile October invoices'] },
];
const select = 'SELECT id, title FROM tasks WHERE project = $1 ORDER BY id';
const insert = 'INSERT INTO tasks (project, title) VALUES ($1, $2) RETURNING id, title';
const slow = 'SELECT pg_sleep(0.25), $1::text AS project';

function checkSpans({ spans, proofId, runKey }) {
  assert(proofId && runKey, 'capture must identify its expected project suffix and run key');
  const tests = spans.filter(s => s.name === 'test.execution');
  assert.deepEqual(tests.map(t => t.attributes['buildkite.test.name']).sort(), cases.map(c => c.name).sort());
  const app = spans.filter(s => s.service === 'project-board');
  assert(app.length > 0, 'missing app spans');
  const byId = new Map(spans.map(s => [`${s.traceId}:${s.spanId}`, s]));
  assert.equal(byId.size, spans.length, 'duplicate span IDs');
  for (const t of tests) {
    assert.equal(t.parentSpanId, '', 'test must be the trace root');
    assert.equal(t.attributes['test.case.result.status'], 'pass');
    assert.equal(t.stream, 'test', 'test transport stream');
    assert.equal(t.runKey, runKey, 'test transport run key');
    assert.equal(t.attributes['buildkite.run_key'], runKey, 'test attribute run key');
  }
  for (const s of app) {
    assert.equal(s.stream, 'child', 'app transport stream');
    let ancestor = s;
    const seen = new Set();
    while (ancestor && !tests.includes(ancestor)) {
      assert(!seen.has(ancestor.spanId), 'cyclic ancestry');
      seen.add(ancestor.spanId);
      ancestor = byId.get(`${s.traceId}:${ancestor.parentSpanId}`);
    }
    assert(ancestor, `orphan app span: ${s.name}`);
    assert.equal(s.runKey, ancestor.runKey, 'app/test transport run keys differ');
    const slack = 1_000_000_000n;
    assert(BigInt(s.startTimeUnixNano) >= BigInt(ancestor.startTimeUnixNano) - slack, 'app starts before test');
    assert(BigInt(s.endTimeUnixNano) <= BigInt(ancestor.endTimeUnixNano) + slack, 'app ends after test');
    if (s.scope === '@opentelemetry/instrumentation-http') {
      assert.equal(s.kind, 2, 'app HTTP span must be a server span');
      assert.equal(s.parentSpanId, ancestor.spanId, 'HTTP server parent must be the test');
    }
  }
  const summary = [];
  for (const c of cases) {
    const t = tests.find(t => t.attributes['buildkite.test.name'] === c.name);
    const children = app.filter(s => s.traceId === t.traceId);
    const http = children.filter(s => s.scope === '@opentelemetry/instrumentation-http');
    const queries = children.filter(s => s.scope === '@opentelemetry/instrumentation-pg' && s.name.startsWith('pg.query:'));
    assert.equal(http.length, c.http, `${c.project} HTTP count`);
    assert.equal(queries.length, c.queries, `${c.project} query count`);
    assert(children.some(s => s.scope === '@opentelemetry/instrumentation-express'), `${c.project} missing Express spans`);
    const project = `${c.project}-${proofId}`;
    for (const s of http) {
      const url = new URL(s.attributes['url.path'], 'http://app');
      url.search = s.attributes['url.query'] || '';
      if (url.pathname === '/') assert.equal(url.searchParams.get('project'), project, `${c.project} document project`);
      else assert.equal(url.pathname, `/api/projects/${project}/tasks`, `${c.project} API project`);
    }
    const titles = [];
    let slowCount = 0;
    for (const s of queries) {
      const sql = s.attributes['db.query.text'];
      assert([select, insert, slow].includes(sql), `${c.project} unexpected SQL: ${sql}`);
      const params = s.attributes['db.postgresql.values'].map(v => v.value);
      assert.equal(params[0], project, `${c.project} SQL project`);
      assert.equal(params.length, sql === insert ? 2 : 1, `${c.project} SQL parameter count`);
      if (sql === insert) titles.push(params[1]);
      if (sql === slow) {
        slowCount++;
        assert(BigInt(s.endTimeUnixNano) - BigInt(s.startTimeUnixNano) >= 250_000_000n, 'slow query <250ms');
      }
    }
    assert.deepEqual(titles.sort(), [...c.titles].sort(), `${c.project} exact INSERT titles`);
    assert.equal(slowCount, c.project === 'finance' ? 1 : 0, `${c.project} slow query count`);
    summary.push({ test: c.name, app: children.length, http: http.length, queries: queries.length });
  }
  return { tests: tests.length, app: app.length, cases: summary };
}

module.exports = { checkSpans };
if (require.main === module) {
  const capture = JSON.parse(require('node:fs').readFileSync(process.argv[2], 'utf8'));
  console.log(JSON.stringify(checkSpans(capture), null, 2));
}
