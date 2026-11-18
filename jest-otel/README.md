# Jest OpenTelemetry

Collect test results, manual spans and local HTTP and fetch spans with
`buildkite-test-collector` 1.16.0. For JSON uploads, see [`jest`](../jest).

## Setup

Use Node 24.19.0 from `mise.toml`. From the repository root:

```sh
npm ci --prefix jest-otel
export BUILDKITE_ANALYTICS_TOKEN="your-suite-token"
npm test --prefix jest-otel -- --runInBand
```

The dependencies use the [collector guide]'s SDK 3 setup: API `^1.10`,
`sdk-trace` and `context-async-hooks` `^3`, and the OTLP protobuf exporter
`~0.301.0`, with HTTP `^0.301.0` and undici `^0.35.0` instrumentation.
SDK 3 requires Node 22.15+ and API 1.10+. When upgrading from collector 1.14.0,
replace `sdk-trace-base` with `sdk-trace` (SDK 2.9+ or 3); without it,
OpenTelemetry mode warns and uploads nothing.

Without a suite token, tests run without uploading. OpenTelemetry mode never
falls back to JSON.

The collector runtime records spans in Jest workers. The reporter uploads them;
no separate SDK setup is needed.

## Expected traces

Each test has a separate trace. No external service is required.

```text
test.execution "captures a manual child span"
└── process order

test.execution "captures an HTTP request"
└── GET (HTTP client, /health)
    └── GET (in-process HTTP server)
```

The fetch test has a fetch client → HTTP server chain.

## CI

The [pipeline](../.buildkite/pipeline.yml) runs `bktec run` with its OTLP relay.
Keep `upload-results: false` so only the collector uploads results. The JSON file
bktec requests is local input for scheduling and retries, not another upload.

## Notes

OpenTelemetry support is experimental. Child spans require a plan that includes
them and are billed by data ingested. Review URLs and span attributes for sensitive
data before using real application data.

See the [collector guide] for supported versions, instrumentation and limitations.

[collector guide]: https://github.com/buildkite/bktest/blob/test-collector-javascript/v1.16.0/test-collector-javascript/docs/opentelemetry.md#setup-1
