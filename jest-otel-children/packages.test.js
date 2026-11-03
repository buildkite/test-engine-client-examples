const http = require('http')
const express = require('express')
const { graphql, buildSchema } = require('graphql')
const { createClient } = require('redis')
const { startFakeRedis } = require('./support/fakeRedis')
const { trace } = require('@opentelemetry/api')

// Both the app and schema are constructed before any test runs.
const app = express()
app.get('/package', (req, res) => res.send('express package'))
const schema = buildSchema('type Query { message: String }')
beforeEach(() => {
  console.log('OTEL_PROOF', JSON.stringify({ test: expect.getState().currentTestName, ...trace.getActiveSpan().spanContext() }))
})

test('Express route registered at file load', async () => {
  const server = await new Promise((resolve) => { const listening = app.listen(0, '127.0.0.1', () => resolve(listening)) })
  try {
    const body = await new Promise((resolve, reject) => {
      http.get(`http://127.0.0.1:${server.address().port}/package`, (res) => {
        let body = ''
        res.on('data', (chunk) => { body += chunk })
        res.on('end', () => resolve(body))
      }).on('error', reject)
    })
    expect(body).toBe('express package')
  } finally { await new Promise((resolve) => server.close(resolve)) }
})

test('GraphQL async resolver', async () => {
  const result = await graphql({ schema, source: '{ message }', rootValue: { message: async () => 'graphql package' } })
  expect(result).toEqual({ data: { message: 'graphql package' } })
})

// Real node-redis client and TCP I/O against a deterministic RESP peer,
// matching bktest's fixture; this does not exercise a real Redis server.
test('Redis connect SET GET', async () => {
  const server = await startFakeRedis()
  const client = createClient({ url: `redis://127.0.0.1:${server.address().port}` })
  try {
    await client.connect()
    await client.set('key', 'value')
    expect(await client.get('key')).toBe('value')
  } finally {
    if (client.isOpen) await client.close()
    await new Promise((resolve) => server.close(resolve))
  }
})
