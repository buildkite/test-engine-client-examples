# Jest OpenTelemetry

Jest test results with manual, HTTP, and fetch spans. Copy [jest.config.js](./jest.config.js) and the OpenTelemetry dependencies in [package.json](./package.json); keep both the test collector runtime and reporter. See the [collector guide] for SDK requirements.

Use `Jest (OTel setup by collector)` in [pipeline.yml](../.buildkite/pipeline.yml). The Tests Buildkite plugin sets `upload-results: false`; the JavaScript test collector sends results through bktec's OTLP relay. The JSON file is local input for bktec, not a second upload.

Set `suite-slug` and the test suite's [OIDC policy](https://buildkite.com/docs/pipelines/configure/tests/test-collection/oidc). Adjust result, location prefix, and mise paths; remove `cd jest-otel` for tests at the repository root. Keep the relay configuration and use your own prefix in `BUILDKITE_ANALYTICS_KEY`.

Run locally in this directory with Node from `mise.toml`: `npm ci`, then `npm test -- --runInBand`. Set `BUILDKITE_ANALYTICS_TOKEN` to upload locally.

[collector guide]: https://github.com/buildkite/bktest/blob/test-collector-javascript/v1.16.0/test-collector-javascript/docs/opentelemetry.md#setup-1
