# Jest OpenTelemetry

Two passing tests using published `buildkite-test-collector` 1.14.0. The
[`jest`](../jest) example keeps JSON uploads.

## Setup

Use Node 24 from `mise.toml`. From the repository root:

```sh
npm ci --prefix jest-otel
export BUILDKITE_ANALYTICS_TOKEN="your-suite-token"
npm test --prefix jest-otel -- --runInBand
```

Without a token, tests still run but the collector warns and skips uploads.
OpenTelemetry mode has no JSON fallback, including on configuration or upload
failure. Turn off `otelEnabled` to use JSON instead.

The reporter uploads results; the collector `runtime` records spans in Jest
workers. Keep the normal `node` environment. The collector supplies the tracer
provider and loads the declared HTTP instrumentation; no suite SDK setup is needed.

## Expected traces

Each test has a separate trace. No external service is required.

```text
test.execution "captures a manual child span"
└── process order

test.execution "captures an HTTP request"
└── GET (HTTP client, /health)
    └── GET (in-process HTTP server)
```

## CI

The [pipeline](../.buildkite/pipeline.yml) runs `bktec run` with its 3.5.0 batched
OTLP relay. Only the collector uploads: keep `upload-results: false` (or
`BUILDKITE_TEST_ENGINE_UPLOAD_RESULTS=false` outside the Tests plugin). The JSON
file bktec requests is local input for scheduling and retries, not another upload.
CI clears setup-time credentials before bktec obtains fresh credentials.

## Notes

- Experimental support covers Jest 29/30 with `jest-circus`, not every newer
  major. This example locks Jest 29 and compatible OpenTelemetry SDK 2/exporter
  0.2xx packages. SDK 3 is unsupported.
- Registering your own tracer provider sends test spans only, without children.
  Child spans belong to tests and per-test hooks, not suite setup/teardown.
  Retries have separate executions and traces. Abrupt termination can lose results.
- Test spans cost the same as JSON executions. Child spans require a plan that
  includes them and are billed by data ingested. Review URLs, query strings and
  other potentially sensitive attributes before instrumenting real applications.

See the [1.14.0 OpenTelemetry guide](https://github.com/buildkite/bktest/blob/test-collector-javascript/v1.14.0/test-collector-javascript/docs/opentelemetry.md)
for supported Node versions, instrumentation, authentication, delivery and limits.
