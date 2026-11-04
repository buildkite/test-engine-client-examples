// Observe successful exports without replacing the exporter or its destination.
// Preloaded only by verify.js, outside Jest's sandbox/module cache.
const { appendFileSync } = require('node:fs')
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-proto')
const original = OTLPTraceExporter.prototype.export

OTLPTraceExporter.prototype.export = function (spans, callback) {
  return original.call(this, spans, (result) => {
    if (result.code === 0) {
      for (const span of spans) {
        appendFileSync(process.env.OTEL_PROOF_EXPORTS, JSON.stringify({
          ...span.spanContext(),
          parentSpanId: span.parentSpanContext?.spanId,
          name: span.name,
          scope: span.instrumentationScope.name,
          kind: span.kind,
        }) + '\n')
      }
    }
    callback(result)
  })
}
