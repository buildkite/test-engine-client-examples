import http from 'node:http';
import { once } from 'node:events';
import { trace } from '@opentelemetry/api';
import { beforeEach, expect, test } from 'vitest';

// Creating the tracer at module load also exercises application-style usage.
const tracer = trace.getTracer('example.otel');

beforeEach(({ task }) => {
  // Proof only: the SDK phase's parent is the collector's test.execution root.
  if (process.env.OTEL_PROOF) {
    const phase = trace.getActiveSpan();
    expect(phase).toBeDefined();
    expect(phase.parentSpanContext).toBeDefined();
    console.log('OTEL_PROOF', JSON.stringify({
      test: task.name,
      traceId: phase.spanContext().traceId,
      rootSpanId: phase.parentSpanContext.spanId,
    }));
  }
  tracer.startActiveSpan('prepare_widget', (span) => {
    span.end();
  });
});

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
    tracer.startActiveSpan('handle_health', (span) => {
      response.end('OK');
      span.end();
    });
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');

  try {
    const body = await new Promise((resolve, reject) => {
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

test('captures a fetch request', async () => {
  const server = http.createServer((request, response) => {
    response.end('fetched');
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');

  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/widget`);
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('fetched');
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
});
