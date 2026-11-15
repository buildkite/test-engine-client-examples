import { expect, test } from 'vitest';
import { work } from '../src/app.ts';

test('TypeScript app records package spans', async () => {
  expect(await work('ts')).toEqual({ order: 'ts', graphql: 'hello ts', redis: 'cached', ioredis: 'counted', orders: 1 });
});
