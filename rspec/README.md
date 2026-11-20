# RSpec

Run RSpec with bktec to split your specs across parallel jobs using timings from your Test Engine test suite.

## Pipeline

Add this step to your pipeline:

```yaml
steps:
  - label: ":rspec: RSpec"
    parallelism: 2
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

`BUILDKITE_TESTS_OTLP_RELAY` sends test collector data through bktec's OTLP relay. Set `upload-results: false` because the test collector sends the results, and add an [OIDC policy](https://buildkite.com/docs/pipelines/configure/tests/test-collection/oidc) to your test suite so your pipeline can authenticate.

See `RSpec` and `RSpec (Test Scheduler pool exec)` in [pipeline.yml](../.buildkite/pipeline.yml) for our CI steps. Pool exec keeps its API-token unset to request job-identity claims, but retains the analytics token for the test collector.

## Test collector

Add the test collector and OpenTelemetry dependencies from [Gemfile](./Gemfile), then configure your spec helper:

```ruby
require "opentelemetry/sdk"
require "buildkite/test_collector"

Buildkite::TestCollector.configure(hook: :rspec, otel_enabled: true)
```

## Run locally

Use Ruby from `mise.toml` and run these commands in this directory:

```bash
bundle install
bundle exec rspec
```
