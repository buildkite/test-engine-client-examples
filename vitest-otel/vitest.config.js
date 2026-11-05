import { createRequire } from 'node:module';
import { defineConfig } from 'vitest/config';

const require = createRequire(import.meta.url);

export default defineConfig({
  test: {
    reporters: [
      'default',
      ['json', { outputFile: 'tmp/vitest-results.json' }],
      ['buildkite-test-collector/vitest/reporter', { otelEnabled: true }],
    ],
    experimental: {
      openTelemetry: {
        enabled: true,
        sdkPath: require.resolve('buildkite-test-collector/vitest/otel.js'),
      },
    },
  },
});
