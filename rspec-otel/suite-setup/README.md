# RSpec with suite OpenTelemetry setup

Send RSpec results to Test Engine as OpenTelemetry spans, with HTTP and Active Record child spans, from a suite that configures the OpenTelemetry SDK itself.

> [!WARNING]
> Suites that already configure OpenTelemetry [aren't yet supported](https://buildkite.com/docs/pipelines/configure/tests/test-collection/ruby-collectors#collecting-rspec-tests-with-opentelemetry). Use [collector-setup](../collector-setup/README.md) unless your suite must own the SDK.

## Pipeline

Copy the `RSpec (OpenTelemetry setup in suite)` step from [pipeline.yml](../../.buildkite/pipeline.yml) and [adapt it](../../README.md#adapt-a-step). `BUILDKITE_TESTS_OTLP_RELAY` makes bktec forward the collector's spans to Test Engine and refresh their token. See [Relay OpenTelemetry traces](https://github.com/buildkite/test-engine-client/tree/v3.5.0#relay-opentelemetry-traces).

## Test collector

Add the gems from [Gemfile](./Gemfile), then follow [spec/spec_helper.rb](./spec/spec_helper.rb):

- Set `OTEL_TRACES_EXPORTER=none`. Otherwise, the SDK's default exporter sends spans to the relay a second time.
- Configure the SDK, its service name, and its instrumentation in a `before(:suite)` hook, so the instrumented libraries are already loaded. Child spans keep your provider's resource.
- Register that hook before configuring the collector with `otel_enabled: true`. The collector attaches to your provider in its own `before(:suite)` hook and installs no instrumentation.

See the collector's [OpenTelemetry guide](https://github.com/buildkite/bktest/blob/test-collector-ruby/v2.17.1/test-collector-ruby/docs/opentelemetry.md#choosing-instrumentation).

OpenTelemetry collection is experimental. Child spans count toward your plan's [trace ingestion limits](https://buildkite.com/pricing/feature-comparison) and can include URLs and database statements, so review what your instrumentation records.

## Expected traces

```text
test.execution "OpenTelemetry spans captures an HTTP request"
└── test.body
    ├── connect
    └── GET
```

The Active Record test has `create!`, `save!`, and query spans without SQL. The Redis test has no child spans, because this suite doesn't install Redis instrumentation.

## Run locally

Use Ruby from `mise.toml` in this directory:

```bash
bundle install
bundle exec rspec
```
