# RSpec with test collector SDK setup

[spec/spec_helper.rb](./spec/spec_helper.rb) lets the Ruby test collector configure OpenTelemetry. [Gemfile](./Gemfile) supplies HTTP, Active Record, and Redis instrumentation.

Use `RSpec (OpenTelemetry setup by test collector)` in [pipeline.yml](../../.buildkite/pipeline.yml). The Tests Buildkite plugin sets `upload-results: false`; the test collector sends results through bktec's OTLP relay.

Copy the dependencies and helper. Set `suite-slug` and the test suite's [OIDC policy](https://buildkite.com/docs/pipelines/configure/tests/test-collection/oidc). Adjust result and mise paths; remove `cd rspec-otel/collector-setup` for tests at the repository root. Keep the relay configuration.

Run locally in this directory with Ruby from `mise.toml`: `bundle install`, then `bundle exec rspec`.
