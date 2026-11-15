import { expect, test } from 'vitest';
import app from '../src/app.cjs';

test('CommonJS app records package spans', async () => {
  expect(await app.work('cjs')).toEqual({ order: 'cjs', graphql: 'hello cjs', redis: 'cached', ioredis: 'counted', orders: 1 });
});
