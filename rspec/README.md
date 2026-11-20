# RSpec

RSpec with parallel jobs and Test Scheduler pool exec. Copy the Ruby test collector setup in [spec/spec_helper.rb](./spec/spec_helper.rb) and the dependencies in [Gemfile](./Gemfile).

Use the `RSpec` or `RSpec (Test Scheduler pool exec)` steps in [pipeline.yml](../.buildkite/pipeline.yml). Both set `upload-results: false` in the Tests Buildkite plugin. The test collector uses OpenTelemetry; the `RSpec` step sends it through bktec's OTLP relay.

Set `suite-slug` and the test suite's [OIDC policy](https://buildkite.com/docs/pipelines/configure/tests/test-collection/oidc). Adjust result and mise paths; remove `cd rspec` for tests at the repository root. Keep pool exec's API-token unset for job-identity claims and its analytics token for test collection.

Run locally in this directory with Ruby from `mise.toml`: `bundle install`, then `bundle exec rspec`.
