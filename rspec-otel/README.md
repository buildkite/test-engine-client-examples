# RSpec OpenTelemetry

Collect RSpec results and HTTP and database spans with OpenTelemetry, whether your test suite or the Ruby test collector owns the SDK setup.

## Pipeline

Add this step after choosing one of the test collector setups below:

```yaml
steps:
  - label: ":rspec: RSpec (OpenTelemetry setup by test collector)"
    commands:
      - bundle install
      - bktec run
    env:
      BUILDKITE_TESTS_OTLP_RELAY: "true"
    plugins:
      - tests#v1.1.0:
          test-runner: rspec
          result-path: tmp/rspec.json
          suite-slug: your-suite-slug
          upload-results: false
          client-version: "3.5.0"
```

The test collector sends results through bktec's OTLP relay, so set `upload-results: false`. Add an [OIDC policy](https://buildkite.com/docs/pipelines/configure/tests/test-collection/oidc) to your test suite so your pipeline can authenticate. Both `RSpec (OpenTelemetry setup by test collector)` and `RSpec (OpenTelemetry setup in suite)` are in [pipeline.yml](../.buildkite/pipeline.yml).

## Test collector

- Use [collector-setup](./collector-setup/README.md) if you want the test collector to configure the SDK and registered instrumentation.
- Use [suite-setup](./suite-setup/README.md) if your tests already configure the SDK. This variant selects HTTP and Active Record instrumentation explicitly.

Copy the chosen variant's dependencies and spec helper into your project, not the enclosing example directory.

## Run locally

Use Ruby from the chosen variant's `mise.toml` and run inside that variant:

```bash
bundle install
bundle exec rspec
```
