# Jest OpenTelemetry

See Jest test results alongside manual, HTTP, and fetch spans in Test Engine using the JavaScript test collector's OpenTelemetry support.

## Pipeline

```yaml
steps:
  - label: ":jest: Jest (OTel setup by collector)"
    commands:
      - npm ci
      - export BUILDKITE_ANALYTICS_KEY="$$BUILDKITE_BUILD_ID-jest-otel-$$BUILDKITE_JOB_ID"
      - bktec run
    env:
      BUILDKITE_TESTS_OTLP_RELAY: "true"
      BUILDKITE_TESTS_OTLP_RELAY_BATCHING: "true"
    plugins:
      - tests#v1.1.0:
          test-runner: jest
          result-path: jest-result.json
          suite-slug: your-suite-slug
          upload-results: false
          client-version: "3.5.0"
```

The test collector sends results through bktec's OTLP relay, so set `upload-results: false` to disable bktec's separate result upload. The JSON file stays local for bktec to read. Add an [OIDC policy](https://buildkite.com/docs/pipelines/configure/tests/test-collection/oidc) to your test suite so your pipeline can authenticate. Our `Jest (OTel setup by collector)` step is in [pipeline.yml](../.buildkite/pipeline.yml).

## Test collector

Add the dependencies from [package.json](./package.json) and copy [jest.config.js](./jest.config.js). Keep `otelEnabled: true`, the test collector runtime, and the reporter: the runtime records spans in workers and the reporter sends them. See the [collector guide] for SDK requirements.

## Run locally

Use Node from `mise.toml` and run in this directory. Set `BUILDKITE_ANALYTICS_TOKEN` if you want to upload locally.

```bash
npm ci
npm test -- --runInBand
```

[collector guide]: https://github.com/buildkite/bktest/blob/test-collector-javascript/v1.16.0/test-collector-javascript/docs/opentelemetry.md#setup-1
