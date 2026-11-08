import { createRequire } from 'node:module';
import { defineConfig } from 'vitest/config';

const require = createRequire(import.meta.url);

export default defineConfig({
  test: {
    reporters: [
      'default',
      'json',
      ['buildkite-test-collector/vitest/reporter', { otelEnabled: true }],
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
