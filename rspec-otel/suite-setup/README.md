# RSpec with test suite SDK setup

[spec/spec_helper.rb](./spec/spec_helper.rb) configures the OpenTelemetry SDK in `before(:suite)` and selects HTTP and Active Record instrumentation. The Ruby test collector uses that provider; Redis calls remain uninstrumented.

Use `RSpec (OpenTelemetry setup in suite)` in [pipeline.yml](../../.buildkite/pipeline.yml). The Tests Buildkite plugin sets `upload-results: false`; the test collector sends results through bktec's OTLP relay.

Copy [Gemfile](./Gemfile) and the helper. Set `suite-slug` and the test suite's [OIDC policy](https://buildkite.com/docs/pipelines/configure/tests/test-collection/oidc). Adjust result and mise paths; remove `cd rspec-otel/suite-setup` for tests at the repository root. Keep the relay configuration.

Run locally in this directory with Ruby from `mise.toml`: `bundle install`, then `bundle exec rspec`.
