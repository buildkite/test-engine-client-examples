const http = require('http')
const nock = require('nock')
const proof = require('./support/proof')
test('nock intercepted request', async () => {
  proof('nock intercepted request')
  const scope = nock('http://nock.example').get('/value').reply(200, 'intercepted')
  try {
    const body = await new Promise((resolve, reject) => {
      http.get('http://nock.example/value', (res) => {
        let body = ''
        res.on('data', (chunk) => { body += chunk })
        res.on('end', () => resolve(body))
      }).on('error', reject)
    })
    expect(body).toBe('intercepted')
    expect(scope.isDone()).toBe(true)
  } finally { nock.restore(); nock.cleanAll() }
})
