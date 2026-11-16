// Verification only: package child spans from Express, GraphQL, Redis and pg.
// Redis and pg use real clients against minimal wire peers, not real servers.
const http = require('http');
const net = require('net');
const express = require('express');
const { graphql, buildSchema } = require('graphql');
const { createClient } = require('redis');
const { Client } = require('pg');

// Built at file load, before any test runs, like most apps under test.
const app = express();
app.get('/package', (req, res) => res.send('express package'));
const schema = buildSchema('type Query { message: String }');

const listen = (server) => new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
const close = (server) => new Promise((resolve) => server.close(resolve));

test('Express route', async () => {
  const server = await listen(http.createServer(app));
  try {
    const body = await new Promise((resolve, reject) => {
      http.get(`http://127.0.0.1:${server.address().port}/package`, (response) => {
        let body = '';
        response.on('data', (chunk) => { body += chunk; });
        response.on('end', () => resolve(body));
      }).on('error', reject);
    });
    expect(body).toBe('express package');
  } finally {
    await close(server);
  }
});

test('GraphQL resolver', async () => {
  const result = await graphql({ schema, source: '{ message }', rootValue: { message: async () => 'graphql package' } });
  expect(result).toEqual({ data: { message: 'graphql package' } });
});

// GET replies "value"; every other command replies +OK.
const fakeRedis = () => net.createServer((socket) => {
  let pending = Buffer.alloc(0);
  socket.on('data', (data) => {
    pending = Buffer.concat([pending, data]);
    for (;;) {
      const text = pending.toString('latin1');
      const match = /^\*(\d+)\r\n/.exec(text);
      if (!match) return;
      let cursor = match[0].length;
      const args = [];
      for (let i = 0; i < Number(match[1]); i++) {
        const header = /^\$(\d+)\r\n/.exec(text.slice(cursor));
        if (!header || text.length < cursor + header[0].length + Number(header[1]) + 2) return;
        cursor += header[0].length;
        args.push(text.slice(cursor, cursor + Number(header[1])));
        cursor += Number(header[1]) + 2;
      }
      pending = pending.subarray(cursor);
      socket.write(args[0].toUpperCase() === 'GET' ? '$5\r\nvalue\r\n' : '+OK\r\n');
    }
  });
});

test('Redis SET and GET', async () => {
  const server = await listen(fakeRedis());
  const client = createClient({ url: `redis://127.0.0.1:${server.address().port}` });
  try {
    await client.connect();
    await client.set('key', 'value');
    expect(await client.get('key')).toBe('value');
  } finally {
    if (client.isOpen) await client.close();
    await close(server);
  }
});

const int = (value, bytes = 4) => {
  const buffer = Buffer.alloc(bytes);
  buffer.writeIntBE(value, 0, bytes);
  return buffer;
};
const pgMessage = (type, ...parts) => {
  const body = Buffer.concat(parts);
  return Buffer.concat([Buffer.from(type), int(body.length + 4), body]);
};
// Trusts the startup message, then answers every simple query with one row: 7.
const fakePostgres = () => net.createServer((socket) => {
  let pending = Buffer.alloc(0);
  let started = false;
  socket.on('data', (chunk) => {
    pending = Buffer.concat([pending, chunk]);
    if (!started) {
      if (pending.length < 4 || pending.length < pending.readInt32BE(0)) return;
      pending = pending.subarray(pending.readInt32BE(0));
      started = true;
      socket.write(Buffer.concat([pgMessage('R', int(0)), pgMessage('Z', Buffer.from('I'))]));
    }
    while (pending.length >= 5 && pending.length >= pending.readInt32BE(1) + 1) {
      const size = pending.readInt32BE(1) + 1;
      const type = String.fromCharCode(pending[0]);
      if (type === 'Q') {
        socket.write(Buffer.concat([
          pgMessage('T', int(1, 2), Buffer.from('answer\0'), int(0), int(0, 2), int(23), int(4, 2), int(-1), int(0, 2)),
          pgMessage('D', int(1, 2), int(1), Buffer.from('7')),
          pgMessage('C', Buffer.from('SELECT 1\0')),
          pgMessage('Z', Buffer.from('I')),
        ]));
      } else if (type === 'X') {
        socket.end();
      }
      pending = pending.subarray(size);
    }
  });
});

test('pg query', async () => {
  const server = await listen(fakePostgres());
  const client = new Client({ host: '127.0.0.1', port: server.address().port, user: 'example', database: 'example', ssl: false });
  try {
    await client.connect();
    expect((await client.query('SELECT 7 AS answer')).rows).toEqual([{ answer: 7 }]);
  } finally {
    await client.end();
    await close(server);
  }
});
