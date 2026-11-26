# RSpec

Split RSpec specs across parallel jobs with bktest. The Ruby test collector sends results to Test Engine as OpenTelemetry spans.

## Pipeline

Copy the `RSpec` step from [pipeline.yml](../.buildkite/pipeline.yml) and [adapt it](../README.md#adapt-a-step). `BUILDKITE_TESTS_OTLP_RELAY` makes bktest forward the collector's spans to Test Engine and refresh their token. See [Relay OpenTelemetry traces](https://github.com/buildkite/bktest/tree/v3.7.0#relay-opentelemetry-traces).

For Test Scheduler, copy `Plan RSpec pool` and [pool-workers.yml](./pool-workers.yml), then [adapt the pair](../README.md#adapt-a-test-scheduler-pool). `bktest pool run -- bundle exec buildkite-rspec` keeps one RSpec process in each worker. It doesn't use the relay, so the collector uploads with the plugin's token.

## Test collector

Add the gems from [Gemfile](./Gemfile) and configure the collector with `otel_enabled: true`, as in [spec/spec_helper.rb](./spec/spec_helper.rb). To upload JSON instead, remove `otel_enabled`. See [Collecting RSpec tests with OpenTelemetry](https://buildkite.com/docs/pipelines/configure/tests/test-collection/ruby-collectors#collecting-rspec-tests-with-opentelemetry).

OpenTelemetry collection is experimental. Child spans count toward your plan's [trace ingestion limits](https://buildkite.com/pricing/feature-comparison) and can include URLs and database statements, so review what your instrumentation records.

## Run locally

Use Ruby from `mise.toml` in this directory:

```bash
bundle install
bundle exec rspec
```
