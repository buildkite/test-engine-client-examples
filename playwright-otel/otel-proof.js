// Proof only, enabled by OTEL_PROOF: print the IDs of every span the collector
// starts for each attempt, so stored traces can be matched to this job.
// Customer configuration does not need this reporter.
const { BasicTracerProvider } = require('@opentelemetry/sdk-trace-base');

const spans = [];
const getTracer = BasicTracerProvider.prototype.getTracer;
BasicTracerProvider.prototype.getTracer = function (...args) {
  const tracer = getTracer.apply(this, args);
  const startSpan = tracer.startSpan;
  tracer.startSpan = function (...spanArgs) {
    const span = startSpan.apply(this, spanArgs);
    spans.push(span);
    return span;
  };
  return tracer;
};

const countSteps = (steps) => steps.reduce((count, step) => count + 1 + countSteps(step.steps), 0);

module.exports = class OtelProof {
  printsToStdio() {
    return true;
  }

  // Runs after the collector reporter has ended this attempt's root span.
  onTestEnd(test, result) {
    const root = spans.find(span => span.name === 'test.execution' && span.ended && !span.proven);
    if (!root) return console.log('OTEL_PROOF missing root', test.title, result.retry);
    root.proven = true;
    const { traceId, spanId } = root.spanContext();
    const trace = spans.filter(span => span.spanContext().traceId === traceId);
    console.log('OTEL_PROOF', JSON.stringify({
      test: test.titlePath().filter(Boolean).join(' > '),
      retry: result.retry,
      status: result.status,
      traceId,
      rootSpanId: spanId,
      playwrightSteps: countSteps(result.steps),
      spans: trace.map(span => [span.spanContext().spanId, span.parentSpanContext?.spanId ?? null, span.name]),
    }));
  }
};
