# RSpec OpenTelemetry

Two ways to configure the Ruby test collector's OpenTelemetry path:

- [collector-setup](./collector-setup/README.md): the test collector configures the SDK and registered instrumentation.
- [suite-setup](./suite-setup/README.md): the test suite configures the SDK and selects instrumentation.

Use `RSpec (OpenTelemetry setup by test collector)` or `RSpec (OpenTelemetry setup in suite)` in [pipeline.yml](../.buildkite/pipeline.yml). Both use the Tests Buildkite plugin with `upload-results: false` and send test collector data through bktec's OTLP relay.

Copy one variant's `Gemfile` and `spec/spec_helper.rb`. Set `suite-slug` and the test suite's [OIDC policy](https://buildkite.com/docs/pipelines/configure/tests/test-collection/oidc). Adjust result and mise paths; remove the variant's `cd` for tests at the repository root.

Run locally inside the chosen variant with Ruby from its `mise.toml`: `bundle install`, then `bundle exec rspec`.
