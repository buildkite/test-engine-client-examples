const { trace } = require('@opentelemetry/api')
const proof = require('./support/proof')
const manual = async (name) => {
  proof(name)
  await trace.getTracer('examples').startActiveSpan('lifecycle', async (span) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 5))
      expect(3 + 4).toBe(7)
    } finally { span.end() }
  })
}

test.each([2, 7])('parameterized %i', (value) => manual(`parameterized ${value}`))
let attempts = 0
jest.retryTimes(1, { logErrorsBeforeRetry: true })
test('retry fails once then passes', async () => {
  await manual('retry fails once then passes')
  expect(++attempts).toBe(2)
})
test.concurrent.each(['left', 'right'])('concurrent %s', (side) => manual(`concurrent ${side}`))
