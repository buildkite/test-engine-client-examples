const http = require('http')
const { trace } = require('@opentelemetry/api')
let server
let url
beforeAll(async () => {
  server = http.createServer((req, res) => res.end('real instrumented I/O'))
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  url = `http://127.0.0.1:${server.address().port}`
})
afterAll(() => new Promise((resolve) => server.close(resolve)))

beforeEach(() => {
  const root = trace.getActiveSpan().spanContext()
  console.log('OTEL_PROOF', JSON.stringify({ test: expect.getState().currentTestName, ...root }))
})

test('HTTP I/O inside a manual span', async () => {
  await trace.getTracer('examples').startActiveSpan('manual request', async (span) => {
    try {
      const text = await new Promise((resolve, reject) => {
        http.get(url, (res) => {
          let body = ''
          res.on('data', (chunk) => { body += chunk })
          res.on('end', () => resolve(body))
        }).on('error', reject)
      })
      expect(text).toBe('real instrumented I/O')
    } finally { span.end() }
  })
})

test('fetch I/O', async () => {
  const response = await fetch(url)
  expect(await response.text()).toBe('real instrumented I/O')
})
