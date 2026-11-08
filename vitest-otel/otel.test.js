import http from 'node:http';
import { once } from 'node:events';
import { trace } from '@opentelemetry/api';
import { beforeEach, expect, test } from 'vitest';

const tracer = trace.getTracer('example.otel');
let order;

beforeEach(() => {
  tracer.startActiveSpan('seed order', (span) => {
    try {
      order = { quantity: 3, unitPrice: 7 };
    } finally {
      span.end();
    }
  });
});

test('captures a manual child span', () => {
  tracer.startActiveSpan('process order', (span) => {
    try {
      expect(order.quantity * order.unitPrice).toBe(21);
    } finally {
      span.end();
    }
  });
});

test('captures an HTTP request', async () => {
  const server = http.createServer((request, response) => {
    tracer.startActiveSpan('handle health', (span) => {
      try {
        response.end('OK');
      } finally {
        span.end();
      }
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
