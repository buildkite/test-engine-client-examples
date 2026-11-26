const { createServer } = require('node:http');

const server = createServer((request, response) => {
  response.setHeader('Content-Type', 'text/html; charset=utf-8');
  switch (request.url) {
    case '/':
      response.end('<!doctype html><title>Playwright example</title><a href="/installation">Get started</a>');
      break;
    case '/installation':
      response.end('<!doctype html><title>Installation</title><h1>Installation</h1>');
      break;
    default:
      response.writeHead(404).end();
  }
});

server.listen(0, '127.0.0.1', () => {
  console.log(`Listening on port ${server.address().port}`);
});
