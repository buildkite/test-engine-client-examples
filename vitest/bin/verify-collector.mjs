import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:http';
import { test } from 'node:test';

test('collector uploads all Vitest 5 results once and awaits the response', { timeout: 30_000 }, async (t) => {
  const uploads = [];
  const server = createServer(async (request, response) => {
    let body = '';
    for await (const chunk of request) body += chunk;
    uploads.push({ url: request.url, method: request.method, body: JSON.parse(body) });
    // An unawaited upload must not look like a successful integration.
    setTimeout(() => {
      response.writeHead(202, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ accepted: 'vitest-5-integration' }));
    }, 100);
  });
  t.after(() => server.close());
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');

  const child = spawn(process.execPath, ['node_modules/vitest/vitest.mjs', 'run'], {
    env: {
      ...process.env,
      BUILDKITE_ANALYTICS_TOKEN: 'local-integration-test',
      BUILDKITE_ANALYTICS_BASE_URL: `http://127.0.0.1:${server.address().port}/v1/uploads`,
      BUILDKITE_ANALYTICS_DEBUG_ENABLED: 'true',
      BUILDKITE_ANALYTICS_LOCATION_PREFIX: 'vitest',
      NO_PROXY: '127.0.0.1',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  t.after(() => child.kill());
  let output = '';
  child.stdout.on('data', (chunk) => { output += chunk; });
  child.stderr.on('data', (chunk) => { output += chunk; });
  const [code] = await once(child, 'close');
  assert.equal(code, 0, output);
  assert.equal(uploads.length, 1, output);
  assert.match(output, /Test Engine success response.*vitest-5-integration/);
  const [upload] = uploads;
  assert.equal(upload.method, 'POST');
  assert.equal(upload.url, '/v1/uploads');
  assert.equal(upload.body.format, 'json');
  assert.equal(upload.body.tags['test.framework.version'], '5.0.0');
  assert.deepEqual(upload.body.data.map(({ scope, name, result }) => ({ scope, name, result })), [
    { scope: 'arithmetic', name: 'adds two numbers', result: 'passed' },
    { scope: 'arithmetic nested', name: 'is skipped', result: 'skipped' },
    { scope: 'arithmetic nested', name: 'is pending', result: 'pending' },
    { scope: 'arithmetic nested', name: 'skips at runtime', result: 'skipped' },
  ]);
  for (const result of upload.body.data) {
    assert.equal(result.file_name, 'vitest/tests/example.test.js');
    assert.ok(result.location.startsWith('vitest/tests/example.test.js:'));
  }
});
