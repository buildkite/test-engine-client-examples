# RSpec with test collector SDK setup

Collect RSpec results and HTTP, SQL, and Redis spans while the Ruby test collector sets up OpenTelemetry for you.

## Pipeline

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

The test collector sends results through bktec's OTLP relay, so set `upload-results: false`. Add an [OIDC policy](https://buildkite.com/docs/pipelines/configure/tests/test-collection/oidc) to your test suite so your pipeline can authenticate. Our `RSpec (OpenTelemetry setup by test collector)` step is in [pipeline.yml](../../.buildkite/pipeline.yml).

## Test collector

Add the dependencies from [Gemfile](./Gemfile) and require your instrumentation before configuring the test collector with `hook: :rspec` and `otel_enabled: true`, as in [spec/spec_helper.rb](./spec/spec_helper.rb). Leave provider setup to the test collector; use [suite-setup](../suite-setup/README.md) if you already configure a provider.

## Run locally

Use Ruby from `mise.toml` and run in this directory:

```bash
bundle install
bundle exec rspec
```
