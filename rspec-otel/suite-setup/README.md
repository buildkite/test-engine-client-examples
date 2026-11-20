# RSpec with test suite SDK setup

Collect RSpec results and HTTP and SQL spans using the OpenTelemetry provider your test suite configures.

## Pipeline

```yaml
steps:
  - label: ":rspec: RSpec (OpenTelemetry setup in suite)"
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

The Ruby test collector sends results through bktec's OTLP relay, so set `upload-results: false`. Add an [OIDC policy](https://buildkite.com/docs/pipelines/configure/tests/test-collection/oidc) to your test suite so your pipeline can authenticate. Our `RSpec (OpenTelemetry setup in suite)` step is in [pipeline.yml](../../.buildkite/pipeline.yml).

## Test collector

Add the dependencies from [Gemfile](./Gemfile) and configure the SDK in `before(:suite)`, as in [spec/spec_helper.rb](./spec/spec_helper.rb). This lets loaded libraries receive the HTTP and Active Record instrumentation. Configure the test collector with `hook: :rspec` and `otel_enabled: true` to use that provider. Redis stays uninstrumented in this variant.

## Run locally

Use Ruby from `mise.toml` and run in this directory:

```bash
bundle install
bundle exec rspec
```
