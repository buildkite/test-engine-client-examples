# Jest OpenTelemetry

Send Jest results to Test Engine as OpenTelemetry spans, with manual, HTTP, and fetch child spans, through bktest's OTLP relay.

## Pipeline

Copy the `Jest (OTel setup by collector)` step from [pipeline.yml](../.buildkite/pipeline.yml) and [adapt it](../README.md#adapt-a-step). `BUILDKITE_TESTS_OTLP_RELAY` makes bktest forward the collector's spans to Test Engine and refresh their token, and `BUILDKITE_TESTS_OTLP_RELAY_BATCHING` sends them in fewer uploads. See [Relay OpenTelemetry traces](https://github.com/buildkite/bktest/tree/v3.6.1#relay-opentelemetry-traces). bktest reads Jest's JSON results to retry and mute tests, but doesn't upload them.

## Test collector

Use Node.js 22.15 or later with Jest 29 or 30. Add the packages from [package.json](./package.json) and keep the collector's reporter, with `otelEnabled: true`, and its `runtime` from [jest.config.js](./jest.config.js). The runtime records spans in Jest workers, and the reporter sends them. See the collector's [Jest guide](https://github.com/buildkite/bktest/blob/test-collector-javascript/v1.16.1/test-collector-javascript/docs/opentelemetry.md#jest).

OpenTelemetry collection is experimental. Child spans count toward your plan's [trace ingestion limits](https://buildkite.com/pricing/feature-comparison) and can include URLs and database statements, so review what your instrumentation records.

## Expected traces

```text
test.execution "captures a manual child span"
└── process order

test.execution "captures an HTTP request"
└── GET (HTTP client)
    └── GET (HTTP server)
```

The fetch test has the same client and server pair, with the client span from undici instrumentation.

## Run locally

Use Node from `mise.toml` in this directory. Set `BUILDKITE_ANALYTICS_TOKEN` to upload results.

```bash
npm ci
npm test
```
