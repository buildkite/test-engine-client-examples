# Playwright OpenTelemetry

Send Playwright results to Test Engine as OpenTelemetry spans, with step, action, and assertion child spans, through bktec's OTLP relay.

## Pipeline

Copy the `Playwright (OpenTelemetry)` step from [pipeline.yml](../.buildkite/pipeline.yml) and [adapt it](../README.md#adapt-a-step). `BUILDKITE_TESTS_OTLP_RELAY` makes bktec forward the collector's spans to Test Engine and refresh their token, and `BUILDKITE_TESTS_OTLP_RELAY_BATCHING` sends them in fewer uploads. See [Relay OpenTelemetry traces](https://github.com/buildkite/test-engine-client/tree/v3.6.0#relay-opentelemetry-traces).

The custom runner splits files that match `test-file-pattern`. bktec doesn't read results from this step, so it can't retry or mute tests.

## Test collector

Use Node.js 22.15 or later with Playwright 1.41.2 or later. Add the packages from [package.json](./package.json) and enable the collector's reporter with `otelEnabled: true`, as in [playwright.config.js](./playwright.config.js). Spans come from Playwright's steps, not from your application or browser. See the collector's [Playwright guide](https://github.com/buildkite/bktest/blob/test-collector-javascript/v1.16.1/test-collector-javascript/docs/opentelemetry.md#playwright).

OpenTelemetry collection is experimental. Child spans count toward your plan's [trace ingestion limits](https://buildkite.com/pricing/feature-comparison), and Playwright records every step, so check the volume before enabling a large suite. Text in actions is redacted, but step titles and assertion messages aren't, so keep secrets out of them.

## Expected traces

Hooks and fixtures also appear. The checkout portion looks like this:

```text
test.execution "confirms an order"
└── checkout
    ├── Fill "[REDACTED]"
    └── submit order
        ├── Click
        └── Expect "toHaveText"
```

## Run locally

Use Node from `mise.toml` in this directory. Set `BUILDKITE_ANALYTICS_TOKEN` to upload results.

```bash
npm ci
npx playwright install --with-deps chromium
npm test
```
