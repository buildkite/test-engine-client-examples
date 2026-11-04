const React = require('react')
const { render, screen, fireEvent, cleanup } = require('@testing-library/react')
const http = require('http')
const fetch = require('cross-fetch')
const { trace } = require('@opentelemetry/api')
const proof = require('./proof')

module.exports = (environment) => {
  let server
  let url
  beforeAll(async () => {
    server = http.createServer((req, res) => res.end('from server'))
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
    url = `http://127.0.0.1:${server.address().port}`
  })
  afterEach(cleanup)
  afterAll(() => new Promise((resolve) => server.close(resolve)))
  test(`${environment} React fetch and manual span`, async () => {
    proof(`${environment} React fetch and manual span`)
    function Component() {
      const [text, setText] = React.useState('load')
      return React.createElement('button', { onClick: async () => setText(await (await fetch(url)).text()) }, text)
    }
    await trace.getTracer('examples').startActiveSpan('component interaction', async (span) => {
      try {
        render(React.createElement(Component))
        fireEvent.click(screen.getByRole('button', { name: 'load' }))
        expect(await screen.findByRole('button', { name: 'from server' })).toBeTruthy()
      } finally { span.end() }
    })
  })
}
