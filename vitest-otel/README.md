# Vitest OpenTelemetry

Vitest test results with hook, manual, HTTP, and fetch spans. Copy [vitest.config.js](./vitest.config.js) and the OpenTelemetry dependencies in [package.json](./package.json). See the [collector guide] for SDK requirements.

Use `Vitest (OpenTelemetry)` in [pipeline.yml](../.buildkite/pipeline.yml). The Tests Buildkite plugin sets `upload-results: false`; the JavaScript test collector sends results through bktec's OTLP relay. Keep the explicit `test-cmd` and `retry-cmd`: default `--reporter` flags would replace the test collector reporter. The JSON file is local input for bktec.

Set `suite-slug` and the test suite's [OIDC policy](https://buildkite.com/docs/pipelines/configure/tests/test-collection/oidc). Adjust result, location prefix, and mise paths; remove `cd vitest-otel` for tests at the repository root. Keep the relay configuration and use your own prefix in `BUILDKITE_ANALYTICS_KEY`.

Run locally in this directory with Node from `mise.toml`: `npm ci`, then `npm test`. Set `BUILDKITE_ANALYTICS_TOKEN` to upload locally.

[collector guide]: https://github.com/buildkite/bktest/blob/test-collector-javascript/v1.16.0/test-collector-javascript/docs/opentelemetry.md#setup-1
