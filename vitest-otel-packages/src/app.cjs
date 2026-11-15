const express = require('express');
const { graphql, buildSchema } = require('graphql');
const { createClient } = require('redis');
const Redis = require('ioredis');
const pg = require('pg');

const schema = buildSchema('type Query { message: String }');
const env = process.env;

const work = async (label) => {
  const app = express();
  app.get('/orders/:id', (request, response) => response.json({ id: request.params.id }));
  const server = await new Promise((resolve) => {
    const listening = app.listen(0, '127.0.0.1', () => resolve(listening));
  });
  let order;
  try {
    order = await (await fetch(`http://127.0.0.1:${server.address().port}/orders/${label}`)).json();
  } finally {
    server.close();
  }

  const { data } = await graphql({ schema, source: '{ message }', rootValue: { message: async () => `hello ${label}` } });

  const redis = createClient({ url: `redis://127.0.0.1:${env.REDIS_PORT || 6379}` });
  await redis.connect();
  await redis.set(`node-redis:${label}`, 'cached');
  const cached = await redis.get(`node-redis:${label}`);
  await redis.quit();

  const io = new Redis({ host: '127.0.0.1', port: Number(env.REDIS_PORT || 6379) });
  await io.set(`ioredis:${label}`, 'counted');
  const counted = await io.get(`ioredis:${label}`);
  await io.quit();

  const client = new pg.Client({ host: '127.0.0.1', port: Number(env.PGPORT || 5432), user: 'postgres', database: 'postgres' });
  await client.connect();
  await client.query('CREATE TEMP TABLE orders (label text)');
  await client.query('INSERT INTO orders VALUES ($1)', [label]);
  const { rows } = await client.query('SELECT count(*)::int AS orders FROM orders WHERE label = $1', [label]);
  await client.end();

  return { order: order.id, graphql: data.message, redis: cached, ioredis: counted, orders: rows[0].orders };
};

module.exports = { work };
