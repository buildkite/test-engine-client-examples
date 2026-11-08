# Vitest OpenTelemetry

Collect test results, hook, manual, HTTP and fetch spans with
`buildkite-test-collector` 1.14.0. For JSON uploads, see [`vitest`](../vitest) or
[`vitest-4`](../vitest-4).

## Setup

Use Node 24. From the repository root:

```sh
npm ci --prefix vitest-otel
export BUILDKITE_ANALYTICS_TOKEN="your-suite-token"
npm test --prefix vitest-otel
```

Without a suite token, tests run without uploading. OpenTelemetry mode never
falls back to JSON.

Vitest's native tracing connects tests and hooks to the collector. The declared
HTTP and undici instrumentation captures HTTP and Node fetch calls.

## Expected traces

Each test has a separate trace. No external service is required. The HTTP test
produces:

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

## CI

The [pipeline](../.buildkite/pipeline.yml) runs `bktec run` with its OTLP relay.
Keep `upload-results: false` so only the collector uploads results. The JSON file
is local input for bktec, not another upload.

Keep the explicit `test-cmd` and `retry-cmd`: default CLI `--reporter` flags
would disable the collector. `--outputFile` lets bktec choose its JSON path.

## Notes

OpenTelemetry support is experimental. Child spans require a plan that includes
them and are billed by data ingested. Review URLs and span attributes for sensitive
data before using real application data.

See the [collector guide] for supported versions, instrumentation and limitations.

[collector guide]: https://github.com/buildkite/bktest/blob/test-collector-javascript/v1.14.0/test-collector-javascript/docs/opentelemetry.md
