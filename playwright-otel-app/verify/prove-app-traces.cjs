const { startOtlpServer } = require('./otlp-server.cjs');
const { checkSpans } = require('./check-spans.cjs');
const { spawn } = require('node:child_process');
const { randomUUID } = require('node:crypto');
const { mkdirSync, writeFileSync } = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

async function run(graceful) {
  const sink = await startOtlpServer();
  const proofId = randomUUID();
  const runKey = `local-app-proof-${proofId}`;
  const started = Date.now();
  let output = '';
  try {
    const env = { ...process.env,
      BUILDKITE_ANALYTICS_OTLP_ENDPOINT: sink.url,
      BUILDKITE_TESTS_OTLP_TOKEN: 'local-sink-only',
      BUILDKITE_ANALYTICS_KEY: runKey,
      APP_TRACE_PROOF_ID: proofId,
      APP_TRACE_NO_GRACEFUL: graceful ? '' : '1',
      FORCE_COLOR: '0',
    };
    // Never pass a real credential or inherited relay/export destination to
    // this local-only proof. Both SDKs send only to the loopback receiver.
    for (const key of ['BUILDKITE_ANALYTICS_TOKEN', 'BUILDKITE_TEST_ENGINE_API_ACCESS_TOKEN',
      'OTEL_EXPORTER_OTLP_HEADERS', 'OTEL_EXPORTER_OTLP_TRACES_HEADERS', 'OTEL_EXPORTER_OTLP_ENDPOINT',
      'OTEL_EXPORTER_OTLP_TRACES_ENDPOINT']) delete env[key];
    const exit = await new Promise((resolve, reject) => {
      const child = spawn('npx', ['playwright', 'test', '--config=verify/playwright.config.cjs'], {
        cwd: path.resolve(__dirname, '..'), env, stdio: ['ignore', 'pipe', 'pipe'],
      });
      for (const stream of [child.stdout, child.stderr]) stream.on('data', chunk => {
        output += chunk;
        process.stdout.write(chunk);
      });
      child.on('error', reject);
      child.on('close', resolve);
    });
    assert.equal(exit, 0, 'all three functional tests must pass in both shutdown modes');
    const elapsedMs = Date.now() - started;
    assert(elapsedMs < 60000, 'run must finish before the batch schedule expires');
    const capture = { proofId, runKey, spans: sink.spans() };
    const mode = graceful ? 'graceful' : 'sigkill';
    const dir = path.resolve(__dirname, '../tmp/app-trace-proof');
    mkdirSync(dir, { recursive: true });
    // The normalized capture includes run-key/stream headers, never auth.
    writeFileSync(`${dir}/${mode}.json`, JSON.stringify(capture, (_, v) => typeof v === 'bigint' ? String(v) : v, 2));
    writeFileSync(`${dir}/${mode}.log`, output);
    if (graceful) {
      const summary = checkSpans(capture);
      const shutdownStarted = output.match(/OpenTelemetry shutdown started (\d+)/);
      assert(shutdownStarted, 'missing SDK shutdown start acknowledgement');
      assert(output.includes('OpenTelemetry shutdown complete'), 'missing SDK shutdown completion acknowledgement');
      assert(capture.spans.filter(s => s.service === 'project-board').every(s => s.receivedAt >= Number(shutdownStarted[1])),
        'app spans arrived before SDK shutdown');
      console.log('GRACEFUL:', JSON.stringify({ ...summary, elapsedMs, batchScheduleMs: 60000, appSpansBeforeShutdown: 0 }));
      return capture;
    }
    assert.equal(capture.spans.filter(s => s.name === 'test.execution').length, 3);
    assert.equal(capture.spans.filter(s => s.service === 'project-board').length, 0, 'SIGKILL must lose the pending app batch');
    assert(!output.includes('OpenTelemetry shutdown complete'), 'SIGKILL unexpectedly ran SDK shutdown');
    assert.throws(() => checkSpans(capture), /missing app spans/);
    console.log('SIGKILL:', JSON.stringify({ tests: 3, app: 0, elapsedMs, batchScheduleMs: 60000, checker: 'rejected missing app spans' }));
  } finally {
    await sink.close();
  }
}

function checkControls(capture) {
  const controls = [
    ['wrong app run key', data => {
      for (const s of data.spans.filter(s => s.service === 'project-board')) s.runKey = 'wrong-run';
    }, /transport run keys differ/],
    ['missing design INSERT', data => {
      const s = data.spans.find(s => s.attributes['db.query.text']?.startsWith('INSERT') &&
        s.attributes['db.postgresql.values'][0].value.startsWith('design-'));
      data.spans.splice(data.spans.indexOf(s), 1);
    }, /design query count/],
    ['finance INSERT has operations title', data => {
      const s = data.spans.find(s => s.attributes['db.query.text']?.startsWith('INSERT') &&
        s.attributes['db.postgresql.values'][0].value.startsWith('finance-'));
      s.attributes['db.postgresql.values'][1].value = 'Rotate staging credentials';
    }, /finance exact INSERT titles/],
    ['dangling app parent', data => {
      data.spans.find(s => s.service === 'project-board').parentSpanId = '0000000000000000';
    }, /orphan app span/],
    ['wrong app stream', data => {
      data.spans.find(s => s.service === 'project-board').stream = 'test';
    }, /app transport stream/],
    ['wrong test stream', data => {
      for (const s of data.spans.filter(s => s.name === 'test.execution')) s.stream = 'child';
    }, /test transport stream/],
  ];
  for (const [name, mutate, failure] of controls) {
    const data = structuredClone(capture);
    mutate(data);
    assert.throws(() => checkSpans(data), failure, `checker accepted corruption: ${name}`);
    console.log(`CONTROL rejected: ${name}`);
  }
}

async function checkTransportControls() {
  const sink = await startOtlpServer();
  try {
    // An empty protobuf ExportTraceServiceRequest is valid. Keep its body
    // identical so only the URL/method distinguishes rejection from success.
    const post = { method: 'POST', body: Buffer.alloc(0), headers: { 'Content-Type': 'application/x-protobuf' } };
    assert.equal((await fetch(sink.url, post)).status, 200, 'valid OTLP POST');
    assert.equal((await fetch(new URL('/wrong-otlp-path', sink.url), post)).status, 404, 'sink accepted wrong OTLP path');
    console.log('HTTP CONTROL rejected: wrong OTLP path');
    assert.equal((await fetch(sink.url)).status, 405, 'sink accepted wrong OTLP method');
    console.log('HTTP CONTROL rejected: wrong OTLP method');
    assert.equal(sink.spans().length, 0, 'transport controls must not record spans');
  } finally {
    await sink.close();
  }
}

(async () => {
  await checkTransportControls();
  checkControls(await run(true));
  await run(false);
  console.log('PROVED: exact app/test joins and data, 6/6 corruption controls, wrong OTLP path/method rejected, shutdown-only app batch flushed; SIGKILL loses it');
})().catch(error => { console.error(error); process.exitCode = 1; });
