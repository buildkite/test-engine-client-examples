# Cucumber

Cucumber with parallel jobs. Copy the Ruby test collector setup in [features/support/env.rb](./features/support/env.rb) and the dependencies in [Gemfile](./Gemfile).

Use the `Cucumber` step in [pipeline.yml](../.buildkite/pipeline.yml). The Tests Buildkite plugin sets `upload-results: false`; the Ruby test collector uploads results.

Set `suite-slug` and the test suite's [OIDC policy](https://buildkite.com/docs/pipelines/configure/tests/test-collection/oidc). Adjust feature, result, location prefix, and mise paths; remove `cd cucumber` for features at the repository root.

Run locally in this directory with Ruby from `mise.toml`: `bundle install`, then `bundle exec cucumber`.
