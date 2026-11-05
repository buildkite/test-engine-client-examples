const { appendFileSync } = require('node:fs')
const { trace } = require('@opentelemetry/api')

module.exports = () => {
  const span = trace.getActiveSpan()
  expect(span).toBeDefined()
  expect(span.isRecording()).toBe(false)
  appendFileSync(process.env.OTEL_BATCH_PROOFS, JSON.stringify({
    test: expect.getState().currentTestName,
    pid: process.pid,
    ...span.spanContext(),
  }) + '\n')
}
