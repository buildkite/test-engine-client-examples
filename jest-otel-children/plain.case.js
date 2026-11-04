const http = require('http')
const proof = require('./support/proof')
test('plain file after nock', async () => {
  proof('plain file after nock')
  const server = http.createServer((req, res) => res.end('plain'))
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  try {
    const body = await new Promise((resolve, reject) => {
      http.get(`http://127.0.0.1:${server.address().port}`, (res) => {
        let body = ''
        res.on('data', (chunk) => { body += chunk })
        res.on('end', () => resolve(body))
      }).on('error', reject)
    })
    expect(body).toBe('plain')
  } finally { await new Promise((resolve) => server.close(resolve)) }
})
