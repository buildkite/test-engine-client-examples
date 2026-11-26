# RSpec OpenTelemetry

Send RSpec results to Test Engine as OpenTelemetry spans, with HTTP, Active Record, and Redis child spans. The Ruby test collector configures the OpenTelemetry SDK.

## Pipeline

Copy the `RSpec (OpenTelemetry setup by test collector)` step from [pipeline.yml](../.buildkite/pipeline.yml) and [adapt it](../README.md#adapt-a-step). `BUILDKITE_TESTS_OTLP_RELAY` makes bktest forward the collector's spans to Test Engine and refresh their token. See [Relay OpenTelemetry traces](https://github.com/buildkite/bktest/tree/v3.6.1#relay-opentelemetry-traces).

## Test collector

Add the gems from [Gemfile](./Gemfile). In [spec/spec_helper.rb](./spec/spec_helper.rb), require each instrumentation, then configure the collector with `otel_enabled: true`. The collector configures the SDK and installs the instrumentation when the suite starts. See [Add instrumentation](https://buildkite.com/docs/pipelines/configure/tests/test-collection/ruby-collectors#collecting-rspec-tests-with-opentelemetry-add-instrumentation) and the collector's [OpenTelemetry guide](https://github.com/buildkite/bktest/blob/test-collector-ruby/v2.17.1/test-collector-ruby/docs/opentelemetry.md#choosing-instrumentation).

OpenTelemetry collection is experimental. Child spans count toward your plan's [trace ingestion limits](https://buildkite.com/pricing/feature-comparison) and can include URLs and database statements, so review what your instrumentation records.

## Expected traces

```text
test.execution "OpenTelemetry spans captures an HTTP request"
└── test.body
    ├── connect
    └── GET

test.execution "OpenTelemetry spans captures a Redis command"
└── test.body
    └── SET
```

The Active Record test has `create!`, `save!`, and query spans. Active Record spans don't include SQL.

## Run locally

Use Ruby from `mise.toml` in this directory:

```bash
bundle install
bundle exec rspec
```
