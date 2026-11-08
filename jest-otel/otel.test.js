const http = require('node:http');
const { once } = require('node:events');
const { trace } = require('@opentelemetry/api');

const tracer = trace.getTracer('example.otel');

test('captures a manual child span', () => {
  tracer.startActiveSpan('parse_widget', (span) => {
    try {
      const widget = JSON.parse('{"name":"instrumented"}');
      expect(widget.name).toBe('instrumented');
    } finally {
      span.end();
    }
  });
});

test('captures an HTTP request', async () => {
  const server = http.createServer((request, response) => {
    response.writeHead(200, { 'Content-Length': '2' });
    response.end('OK');
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');

  try {
    const body = await new Promise((resolve, reject) => {
      // Keep the module method call so HTTP instrumentation can wrap it.
      http.get(`http://127.0.0.1:${server.address().port}/health`, (response) => {
        let body = '';
        response.setEncoding('utf8');
        response.on('data', (chunk) => { body += chunk; });
        response.on('end', () => resolve(body));
        response.on('error', reject);
      }).on('error', reject);
    });
    expect(body).toBe('OK');
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
});
