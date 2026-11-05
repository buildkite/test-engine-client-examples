// Observe successful exports without replacing the exporter or its destination.
// Preloaded only by verify.js, outside Jest's sandbox/module cache.
const { appendFileSync } = require('node:fs')
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-proto')
const original = OTLPTraceExporter.prototype.export

// Observe the collector's actual JSON transport too, not just the absence of
// errors when its JSON token is unset. Never send duplicate JSON executions.
if (process.env.OTEL_PROOF_MODE !== 'json') {
  require('axios').interceptors.request.use((config) => {
    if (config.method === 'post' && config.url === (process.env.BUILDKITE_ANALYTICS_BASE_URL || 'https://analytics-api.buildkite.com/v1/uploads')) {
      console.error('OTEL_JSON_UPLOAD')
      throw new Error('OTel mode attempted a JSON result upload')
    }
    return config
  })
}

OTLPTraceExporter.prototype.export = function (spans, callback) {
  return original.call(this, spans, (result) => {
    if (result.code === 0) {
      for (const span of spans) {
        appendFileSync(process.env.OTEL_PROOF_EXPORTS, JSON.stringify({
          ...span.spanContext(),
          exporterPid: process.pid,
          parentSpanId: span.parentSpanContext?.spanId,
          name: span.name,
          scope: span.instrumentationScope.name,
          scopeVersion: span.instrumentationScope.version,
          kind: span.kind,
          attributes: span.attributes,
        }) + '\n')
      }
    }
    callback(result)
  })
}
