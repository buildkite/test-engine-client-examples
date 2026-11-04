const { trace } = require('@opentelemetry/api')
module.exports = (test) => {
  if (process.env.OTEL_PROOF_MODE === 'json') return
  const span = trace.getActiveSpan()
  expect(span).toBeDefined()
  console.log('OTEL_PROOF', JSON.stringify({ test, pid: process.pid, ...span.spanContext() }))
}
