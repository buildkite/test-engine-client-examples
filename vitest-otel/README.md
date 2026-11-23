# Vitest OpenTelemetry

Send Vitest results to Test Engine as OpenTelemetry spans, with hook, manual, HTTP, and fetch child spans, through bktec's OTLP relay.

## Pipeline

Copy the `Vitest (OpenTelemetry)` step from [pipeline.yml](../.buildkite/pipeline.yml) and [adapt it](../README.md#adapt-a-step). `BUILDKITE_TESTS_OTLP_RELAY` makes bktec forward the collector's spans to Test Engine and refresh their token, and `BUILDKITE_TESTS_OTLP_RELAY_BATCHING` sends them in fewer uploads. See [Relay OpenTelemetry traces](https://github.com/buildkite/test-engine-client/tree/v3.6.0#relay-opentelemetry-traces).

Keep the step's `test-cmd` and `retry-cmd`: bktec's default commands pass `--reporter` flags, which replace the collector's reporter. bktec reads Vitest's JSON results to retry and mute tests, but doesn't upload them.

## Test collector

Use Node.js 22.15 or later with Vitest 4.0.11 or later. Add the packages from [package.json](./package.json) and keep Vitest's `experimental.openTelemetry` setup, the collector's reporter, and the JSON reporter from [vitest.config.js](./vitest.config.js). See the collector's [Vitest guide](https://github.com/buildkite/bktest/blob/test-collector-javascript/v1.16.0/test-collector-javascript/docs/opentelemetry.md#vitest) and [Using bktec](https://github.com/buildkite/bktest/blob/test-collector-javascript/v1.16.0/test-collector-javascript/docs/opentelemetry.md#using-bktec).

OpenTelemetry collection is experimental. Child spans count toward your plan's [trace ingestion limits](https://buildkite.com/pricing/feature-comparison) and can include URLs and database statements, so review what your instrumentation records.

## Expected traces

```text
test.execution "captures an HTTP request"
├── vitest.test.runner.test.beforeEach
│   └── seed order
└── vitest.test.runner.test.callback
    └── GET (HTTP client)
        └── GET (HTTP server)
            └── handle health
```

The manual test has `process order` under its callback, and the fetch test has an undici client and HTTP server pair. Every test has the `seed order` hook.

## Run locally

Use Node from `mise.toml` in this directory. Set `BUILDKITE_ANALYTICS_TOKEN` to upload results.

```bash
npm ci
npm test
```
