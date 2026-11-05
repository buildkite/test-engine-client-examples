# Jest OpenTelemetry

Small, collector-owned example using `buildkite-test-collector` 1.13.0, the first
stable release with experimental, opt-in Jest OpenTelemetry support. The existing
[`jest/`](../jest) example still uses JSON uploads.

The reporter enables OTel, and the collector runtime connects tests and child
spans. Keep the normal Node test environment; 1.13.0 no longer uses the beta's
collector `testEnvironment`. Jest 29 and newer (29/30 in the release guide), OTel
SDK 2.x, and Node, jsdom and happy-dom environments are supported. This example
uses Jest 29 and Node 24.

The collector provides the tracer provider. There is no suite-owned-provider
variant: registering your own provider produces a warning and uploads test spans
only, without children. The project's declared `@opentelemetry/instrumentation-http`
dependency supplies automatic HTTP spans; the collector is not a general-purpose
instrumentation bundle. For Node fetch, add a compatible
`@opentelemetry/instrumentation-undici` dependency instead.

```sh
npm ci --prefix jest-otel
npm test --prefix jest-otel -- --runInBand
```

Set `BUILDKITE_ANALYTICS_TOKEN` to a suite token to upload locally. Without a token,
tests still run but the collector warns and skips uploads. OTel mode does not fall
back to JSON. In Test Engine, `captures a manual child span` has `parse_widget`
underneath; `captures an HTTP request` has HTTP client and server spans from a
local `/health` request. No external service is required.

The [CI step](../.buildkite/pipeline.yml) uses `bktec run` and its OTLP relay, with
`upload-results: false` to avoid duplicate uploads. Child spans require a Test
Engine plan that includes them and are billed by data ingested. Review recorded
URLs and other attributes before enabling instrumentation on real applications.

See the [1.13.0 OTel guide](https://github.com/buildkite/bktest/blob/test-collector-javascript/v1.13.0/test-collector-javascript/docs/opentelemetry.md)
for supported dependency versions, environment setup, limitations and settings.
