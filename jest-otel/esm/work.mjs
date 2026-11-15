import { trace } from '@opentelemetry/api';

// Obtained at import time, before the collector sets up the test's provider.
const tracer = trace.getTracer('example.esm');

export const work = (name) => tracer.startSpan(name).end();
