# Playwright OpenTelemetry

Playwright test results with nested steps, browser actions, and assertions. Copy [playwright.config.js](./playwright.config.js) and the OpenTelemetry dependencies in [package.json](./package.json). See the [collector guide] for SDK requirements and tracing limits.

Use `Playwright (OpenTelemetry)` in [pipeline.yml](../.buildkite/pipeline.yml). The Tests Buildkite plugin sets `upload-results: false`; the JavaScript test collector sends results through bktec's OTLP relay. This step uses a custom runner, not the JSON example's Playwright runner.

Set `suite-slug` and the test suite's [OIDC policy](https://buildkite.com/docs/pipelines/configure/tests/test-collection/oidc). Adjust test, output, location prefix, and mise paths; remove `cd playwright-otel` for tests at the repository root. Keep the relay configuration and use your own prefix in `BUILDKITE_ANALYTICS_KEY`.

Run locally in this directory with Node from `mise.toml`:

```sh
npm ci
npx playwright install --with-deps chromium
npm test
```

Set `BUILDKITE_ANALYTICS_TOKEN` to upload locally.

[collector guide]: https://github.com/buildkite/bktest/blob/test-collector-javascript/v1.16.0/test-collector-javascript/docs/opentelemetry.md#setup-1
