# Playwright OpenTelemetry

One passing browser test using published `buildkite-test-collector` 1.14.0. The
[`playwright`](../playwright) example keeps JSON uploads.

## Setup

Use Node 24 from `mise.toml`. From the repository root:

```sh
npm ci --prefix playwright-otel
cd playwright-otel
npx playwright install --with-deps chromium
export BUILDKITE_ANALYTICS_TOKEN="your-suite-token"
npm test
```

Without a token, tests still run but the collector warns and skips uploads.
OpenTelemetry mode has no JSON fallback, including on configuration or upload
failure. Turn off `otelEnabled` to use JSON instead.

Only the reporter needs configuring. No collector runtime, worker SDK or
instrumentation packages are needed; the SDK 2/exporter 0.2xx dependencies let
the reporter export spans. The test uses inline HTML, not an external service.

## Expected traces

Each test attempt has a separate trace. Hooks, fixtures and setup also appear;
the checkout portion looks like:

```text
test.execution "confirms an order"
└── checkout
    ├── Fill "3"
    └── submit order
        ├── Click
        └── Expect "toHaveText"
```

## CI

The [pipeline](../.buildkite/pipeline.yml) runs `bktec run` with its 3.5.0 batched
OTLP relay. Only the collector uploads: keep `upload-results: false` (or
`BUILDKITE_TEST_ENGINE_UPLOAD_RESULTS=false` outside the Tests plugin).
CI clears setup-time credentials before bktec obtains fresh credentials.

## Notes

- This experimental integration uses Playwright's reporter step API; the lockfile
  pins the tested Playwright 1.65.0. SDK 3 is unsupported.
- This is reporter-side tracing: nested `test.step`, actions and assertions,
  not manual worker spans, automatic HTTP/database spans or browser application
  traces. Root duration encloses steps and can exceed Playwright's JSON duration.
- Retries have separate executions and traces. Ctrl-C allows a flush; SIGTERM
  can lose pending results. Collector upload failures do not fail the test run.
- Test spans cost the same as JSON executions. Child spans require a plan that
  includes them and are billed by data ingested. Review step titles, URLs and
  other potentially sensitive attributes before using real application data.

See the [1.14.0 OpenTelemetry guide](https://github.com/buildkite/bktest/blob/test-collector-javascript/v1.14.0/test-collector-javascript/docs/opentelemetry.md)
for supported dependencies, authentication, delivery and limits.
