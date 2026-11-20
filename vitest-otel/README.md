# Vitest OpenTelemetry

See Vitest test results with hook, manual, HTTP, and fetch spans in Test Engine using OpenTelemetry.

## Pipeline

```yaml
steps:
  - label: ":vitest: Vitest (OpenTelemetry)"
    commands:
      - npm ci
      - export BUILDKITE_ANALYTICS_KEY="$$BUILDKITE_BUILD_ID-vitest-otel-$$BUILDKITE_JOB_ID"
      - bktec run
    env:
      BUILDKITE_TESTS_OTLP_RELAY: "true"
      BUILDKITE_TESTS_OTLP_RELAY_BATCHING: "true"
    plugins:
      - tests#v1.1.0:
          test-runner: vitest
          test-cmd: "npx vitest run {{testExamples}} --outputFile {{resultPath}}"
          retry-cmd: "npx vitest run {{testExamples}} --testNamePattern '{{testNamePattern}}' --outputFile {{resultPath}}"
          result-path: tmp/vitest-results.json
          suite-slug: your-suite-slug
          upload-results: false
          client-version: "3.5.0"
```

The JavaScript test collector sends results through bktec's OTLP relay, so set `upload-results: false`. Keep the explicit commands: default `--reporter` flags would replace the test collector reporter. Add an [OIDC policy](https://buildkite.com/docs/pipelines/configure/tests/test-collection/oidc) to your test suite so your pipeline can authenticate. Our `Vitest (OpenTelemetry)` step is in [pipeline.yml](../.buildkite/pipeline.yml).

## Test collector

Add the dependencies from [package.json](./package.json) and copy [vitest.config.js](./vitest.config.js). Keep Vitest's `experimental.openTelemetry` setup, the test collector reporter, and the JSON reporter for bktec's local result file. See the [collector guide] for SDK requirements.

## Run locally

Use Node from `mise.toml` and run in this directory. Set `BUILDKITE_ANALYTICS_TOKEN` if you want to upload locally.

```bash
npm ci
npm test
```

[collector guide]: https://github.com/buildkite/bktest/blob/test-collector-javascript/v1.16.0/test-collector-javascript/docs/opentelemetry.md#setup-1
