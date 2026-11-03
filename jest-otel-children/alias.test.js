const http = require('http')
const express = require('@fixture/express')
const { trace } = require('@opentelemetry/api')

const app = express()
app.get('/alias', (req, res) => res.send('mapped express'))

test('Express loaded through Jest moduleNameMapper', async () => {
  console.log('OTEL_PROOF', JSON.stringify({ test: expect.getState().currentTestName, ...trace.getActiveSpan().spanContext() }))
  const server = await new Promise((resolve) => { const listening = app.listen(0, '127.0.0.1', () => resolve(listening)) })
  try {
    const response = await new Promise((resolve, reject) => {
      http.get(`http://127.0.0.1:${server.address().port}/alias`, (res) => {
        let body = ''
        res.on('data', (chunk) => { body += chunk })
        res.on('end', () => resolve(body))
      }).on('error', reject)
    })
    expect(response).toBe('mapped express')
  } finally { await new Promise((resolve) => server.close(resolve)) }
})
