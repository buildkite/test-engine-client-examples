import { createRequire } from 'node:module';
import { defineConfig } from 'vitest/config';

const require = createRequire(import.meta.url);

export default defineConfig({
  // Load GraphQL's CommonJS build, which its instrumentation patches.
  plugins: [{
    name: 'graphql-commonjs',
    enforce: 'pre',
    resolveId: (id) => (/^graphql(\/|$)/.test(id) ? require.resolve(id) : undefined),
  }],
  test: {
    include: ['test/*.test.{js,ts}'],
    reporters: [
      'default',
      'json',
      [require.resolve('buildkite-test-collector/vitest/reporter'), { otelEnabled: true }],
    ],
    outputFile: 'tmp/vitest-results.json',
    includeTaskLocation: true,
    experimental: {
      openTelemetry: {
        enabled: true,
        sdkPath: require.resolve('buildkite-test-collector/vitest/otel.js'),
      },
    },
  },
});
