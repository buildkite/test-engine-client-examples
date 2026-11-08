# Vitest OpenTelemetry

Three passing tests using published `buildkite-test-collector` 1.14.0. The
[`vitest`](../vitest) and [`vitest-4`](../vitest-4) examples keep JSON uploads.

## Setup

Use Node 24 from `mise.toml`. From the repository root:

```sh
npm ci --prefix vitest-otel
export BUILDKITE_ANALYTICS_TOKEN="your-suite-token"
npm test --prefix vitest-otel
```

Without a token, tests still run but the collector warns and skips uploads.
OpenTelemetry mode has no JSON fallback, including on configuration or upload
failure. Turn off `otelEnabled` to use JSON instead.

The reporter uploads results. Native `experimental.openTelemetry` loads the
collector SDK via a resolved filesystem `sdkPath`; no suite SDK setup is needed.
The declared HTTP and undici instrumentations capture HTTP and Node fetch.

## Expected traces

Each test has a separate trace. All servers use ephemeral loopback ports; no
external service is required. The HTTP test's complete tree is:

```text
test.execution "captures an HTTP request"
├── vitest.test.runner.test.beforeEach
│   └── seed order
└── vitest.test.runner.test.callback
    └── GET (HTTP client, /health)
        └── GET (in-process HTTP server)
            └── handle health
```

The manual test has `process order` under its callback. The fetch test has a
fetch client → HTTP server chain. Both also have the `seed order` hook.
Empty phases and suite-level setup are excluded.

## CI

The [pipeline](../.buildkite/pipeline.yml) runs `bktec run` with its 3.5.0 batched
OTLP relay. Only the collector uploads: keep `upload-results: false` (or
`BUILDKITE_TEST_ENGINE_UPLOAD_RESULTS=false` outside the Tests plugin). The JSON
reporter writes a local result file for bktec, not another upload.

Keep the explicit `test-cmd`: bktec's default CLI `--reporter` flags replace
configured reporters and would disable the collector. `--outputFile` can still
select bktec's JSON path. CI clears setup-time credentials before bktec obtains
fresh credentials.

## Notes

- Experimental child-span support requires Vitest 4.0.11+. This example locks
  Vitest 5.1.0; the same config and tests also work on Vitest 4. Vitest 5 requires
  Node 22.12+. Dependencies stay on SDK 2/exporter 0.2xx and compatible undici;
  SDK 3 is unsupported. Only HTTP and undici instrumentation are supported here.
- Retries share one execution with all attempts' children. Watch mode is
  unsupported; browser mode sends test spans only. SIGTERM can lose pending
  results without a drain or warning. End child spans before workers exit.
- Test spans cost the same as JSON executions. Child spans require a plan that
  includes them and are billed by data ingested. Review URLs, query strings and
  other potentially sensitive attributes before instrumenting real applications.

See the [1.14.0 OpenTelemetry guide](https://github.com/buildkite/bktest/blob/test-collector-javascript/v1.14.0/test-collector-javascript/docs/opentelemetry.md)
for supported versions, authentication, delivery and limits.
