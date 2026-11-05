// Observe the real stock exporter in the Jest parent, without rerouting,
// changing batching or making additional uploads. Keep the normal JSON guard.
require('../support/recordExports')
const { appendFileSync } = require('node:fs')
const { AsyncLocalStorage } = require('node:async_hooks')
const { channel } = require('node:diagnostics_channel')
const { createRequire } = require('node:module')
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-proto')
const exporterRequire = createRequire(require.resolve('@opentelemetry/exporter-trace-otlp-proto'))
const { ProtobufTraceSerializer } = exporterRequire('@opentelemetry/otlp-transformer')
const current = new AsyncLocalStorage()
let sequence = 0
const record = (value) => appendFileSync(process.env.OTEL_BATCH_UPLOADS, JSON.stringify(value) + '\n')

// Async context ties every actual HTTP attempt (including SDK retries) to its
// export. No headers, tokens, endpoint query strings or response bodies logged.
channel('http.client.request.created').subscribe(({ request }) => {
  const upload = current.getStore()
  if (!upload) return
  request.once('response', (response) => {
    response.once('end', () => record({ type: 'response', id: upload.id, status: response.statusCode }))
  })
  request.once('error', (error) => record({ type: 'request-error', id: upload.id, code: error.code }))
})

const original = OTLPTraceExporter.prototype.export
OTLPTraceExporter.prototype.export = function (spans, callback) {
  const upload = {
    type: 'upload', id: `${process.pid}-${++sequence}`, pid: process.pid,
    spans: spans.length, bytes: ProtobufTraceSerializer.serializeRequest(spans).byteLength,
    roots: spans.filter((span) => span.name === 'test.execution').length,
  }
  record(upload)
  return current.run(upload, () => original.call(this, spans, (result) => {
    record({ type: 'result', id: upload.id, code: result.code })
    callback(result)
  }))
}
