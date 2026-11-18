import { createRequire } from 'node:module';
import config from './vitest.config.js';

const require = createRequire(import.meta.url);

// Copy of bktest's pinned package fixtures. Redis and pg use wire peers,
// not real databases. The ESM fixture includes one deliberate assertion failure.
export default {
  ...config,
  plugins: [{
    name: 'graphql-commonjs',
    enforce: 'pre',
    resolveId: id => /^graphql(\/|$)/.test(id) ? require.resolve(id) : undefined,
  }],
  test: {
    ...config.test,
    include: ['otel.test.js', 'packages/cjs.js', 'packages/esm.js', 'packages/ts.ts'],
  },
};
