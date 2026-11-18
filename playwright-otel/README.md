# Playwright OpenTelemetry

Collect test results and nested Playwright steps with
`buildkite-test-collector` 1.16.0. For JSON uploads, see [`playwright`](../playwright).

## Setup

Use Node 24.19.0 from `mise.toml`. From the repository root:

```sh
npm ci --prefix playwright-otel
cd playwright-otel
npx playwright install --with-deps chromium
export BUILDKITE_ANALYTICS_TOKEN="your-suite-token"
npm test
```

The dependencies use the [collector guide]'s SDK 3 setup: API `^1.10`,
`sdk-trace` `^3`, and the OTLP protobuf exporter `~0.301.0`.
Playwright's reporter does not need `context-async-hooks`.
SDK 3 requires Node 22.15+ and API 1.10+. When upgrading from collector 1.14.0,
replace `sdk-trace-base` with `sdk-trace` (SDK 2.9+ or 3); without it,
OpenTelemetry mode warns and uploads nothing.

Without a suite token, tests run without uploading. OpenTelemetry mode never
falls back to JSON.

Tracing comes from Playwright's reporter. It captures steps, actions and
assertions, not HTTP calls, manual worker spans or browser application traces.
The test uses inline HTML, not an external service.

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

The [pipeline](../.buildkite/pipeline.yml) runs `bktec run` with its OTLP relay.
Keep `upload-results: false` so only the collector uploads results.

## Notes

OpenTelemetry support is experimental. Child spans require a plan that includes
them and are billed by data ingested. Review step titles and span attributes for
sensitive data before using real application data.

See the [collector guide] for supported versions, instrumentation and limitations.

[collector guide]: https://github.com/buildkite/bktest/blob/test-collector-javascript/v1.16.0/test-collector-javascript/docs/opentelemetry.md#setup-1
