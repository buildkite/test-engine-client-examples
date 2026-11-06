// Adapted from #93's recordExports/recordUploads: observe, never replace,
// the stock transport, batching policy, destination or request contents.
const { appendFileSync } = require('node:fs')
const { AsyncLocalStorage } = require('node:async_hooks')
const { channel } = require('node:diagnostics_channel')
const { createRequire } = require('node:module')
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-proto')
const exporterRequire = createRequire(require.resolve('@opentelemetry/exporter-trace-otlp-proto'))
const { ProtobufTraceSerializer } = exporterRequire('@opentelemetry/otlp-transformer')
const record = (file, value) => appendFileSync(`${process.env.HARNESS_DIR}/${file}.jsonl`, JSON.stringify(value) + '\n')
const current = new AsyncLocalStorage()
let sequence = 0

const axios = require('axios')
axios.interceptors.request.use((config) => {
  if (config.method !== 'post' || config.url !== (process.env.BUILDKITE_ANALYTICS_BASE_URL || 'https://analytics-api.buildkite.com/v1/uploads')) return config
  if (process.env.HARNESS_MODE !== 'json') throw Error('OTEL_JSON_UPLOAD')
  const { key, ci, url, collector, version, job_id } = config.data.run_env
  record('json', { type: 'request', bytes: Buffer.byteLength(JSON.stringify(config.data)), data: config.data.data,
    runEnv: { key, ci, url, collector, version, job_id }, tags: config.data.tags })
  return config
})
axios.interceptors.response.use((response) => {
  if (process.env.HARNESS_MODE === 'json') {
    // Full collector debug logs include Authorization headers. Whitelist only
    // public upload/run identifiers instead, never request headers or tokens.
    const metadata = Object.fromEntries(['id', 'run_id', 'run_url', 'url'].filter((key) =>
      typeof response.data?.[key] === 'string').map((key) => [key, response.data[key]]))
    const recordValue = { type: 'response', status: response.status,
      responseKeys: Object.keys(response.data || {}), metadata }
    record('json', recordValue)
    console.log('HARNESS_JSON_RESPONSE', JSON.stringify(recordValue))
  }
  return response
}, (error) => {
  record('json', { type: 'error', status: error.response?.status, code: error.code })
  return Promise.reject(error)
})

channel('http.client.request.created').subscribe(({ request }) => {
  const upload = current.getStore()
  if (!upload) return
  request.once('response', (response) => {
    response.once('end', () => record('uploads', { type: 'response', id: upload.id, status: response.statusCode }))
  })
  request.once('error', (error) => record('uploads', { type: 'error', id: upload.id, code: error.code }))
})
const original = OTLPTraceExporter.prototype.export
OTLPTraceExporter.prototype.export = function (spans, callback) {
  const upload = { type: 'upload', id: `${process.pid}-${++sequence}`, pid: process.pid,
    spans: spans.length, bytes: ProtobufTraceSerializer.serializeRequest(spans).byteLength }
  record('uploads', upload)
  return current.run(upload, () => original.call(this, spans, (result) => {
    record('uploads', { type: 'result', id: upload.id, code: result.code })
    if (result.code === 0) for (const span of spans) record('exports', {
      ...span.spanContext(), parentSpanId: span.parentSpanContext?.spanId,
      name: span.name, scope: span.instrumentationScope.name, scopeVersion: span.instrumentationScope.version,
      kind: span.kind, status: span.status, events: span.events, attributes: span.attributes, exporterPid: process.pid,
    })
    callback(result)
  }))
}
