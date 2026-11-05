import { createRequire } from 'node:module'
import { defineConfig } from 'vitest/config'
const require = createRequire(import.meta.url)
const otel = process.env.HARNESS_MODE !== 'json'

export default defineConfig({
  test: {
    include: ['generated/*.test.js'],
    pool: process.env.HARNESS_POOL || 'forks',
    maxWorkers: 2,
    includeTaskLocation: true,
    reporters: ['default', 'json', [otel
      ? 'buildkite-test-collector/vitest/reporter'
      : 'buildkite-test-collector-json/vitest/reporter', {
      ...(otel ? { otelEnabled: true } : {}),
      tags: {
        'harness.build': process.env.BUILDKITE_BUILD_ID || 'local',
        'harness.run': process.env.HARNESS_RUN,
        'harness.mode': process.env.HARNESS_MODE,
        'harness.pool': process.env.HARNESS_POOL || 'forks',
      },
    }]],
    ...(otel ? { experimental: { openTelemetry: {
      enabled: true,
      sdkPath: require.resolve('buildkite-test-collector/vitest/otel.js'),
    } } } : {}),
  },
})
