import { expect, test } from 'vitest';
import { work } from '../src/app.mjs';

test('ES module app records package spans', async () => {
  expect(await work('esm')).toEqual({ order: 'esm', graphql: 'hello esm', redis: 'cached', ioredis: 'counted', orders: 1 });
});
