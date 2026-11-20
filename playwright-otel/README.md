# Playwright OpenTelemetry

See your Playwright test results with nested steps, browser actions, and assertions in Test Engine using OpenTelemetry.

## Pipeline

```yaml
steps:
  - label: ":playwright: Playwright (OpenTelemetry)"
    commands:
      - npm ci
      - npx playwright install --with-deps chromium
      - export BUILDKITE_ANALYTICS_KEY="$$BUILDKITE_BUILD_ID-playwright-otel-$$BUILDKITE_JOB_ID"
      - bktec run
    env:
      BUILDKITE_TESTS_OTLP_RELAY: "true"
      BUILDKITE_TESTS_OTLP_RELAY_BATCHING: "true"
    plugins:
      - tests#v1.1.0:
          test-runner: custom
          test-cmd: "npm test -- {{testExamples}}"
          test-file-pattern: "tests/**/*.spec.js"
          suite-slug: your-suite-slug
          upload-results: false
          client-version: "3.5.0"
```

The custom runner splits test files; adjust `test-file-pattern` to your tests. The JavaScript test collector sends results through bktec's OTLP relay, so set `upload-results: false`. Add an [OIDC policy](https://buildkite.com/docs/pipelines/configure/tests/test-collection/oidc) to your test suite so your pipeline can authenticate. Our `Playwright (OpenTelemetry)` step is in [pipeline.yml](../.buildkite/pipeline.yml).

## Test collector

Add the dependencies from [package.json](./package.json) and enable the reporter with `otelEnabled: true`, as in [playwright.config.js](./playwright.config.js). This captures Playwright steps, not browser application traces. See the [collector guide] for SDK requirements and tracing limits.

## Run locally

Use Node from `mise.toml` and run in this directory. Set `BUILDKITE_ANALYTICS_TOKEN` if you want to upload locally.

```bash
npm ci
npx playwright install --with-deps chromium
npm test
```

[collector guide]: https://github.com/buildkite/bktest/blob/test-collector-javascript/v1.16.0/test-collector-javascript/docs/opentelemetry.md#setup-1
