# Minitest

Minitest file splitting with bktec's custom runner. Copy [Rakefile](./Rakefile), the Ruby test collector setup in [test_helper.rb](./test_helper.rb), and the dependencies in [Gemfile](./Gemfile).

Use the `Minitest` step in [pipeline.yml](../.buildkite/pipeline.yml). The Tests Buildkite plugin sets `upload-results: false`; the Ruby test collector uploads results.

Set `suite-slug` and the test suite's [OIDC policy](https://buildkite.com/docs/pipelines/configure/tests/test-collection/oidc). Adjust test, location prefix, and mise paths; remove `cd ruby-minitest` for tests at the repository root. Keep the Rake task's `TEST_FILES` handling so it runs only assigned files.

Run locally in this directory with Ruby from `mise.toml`: `bundle install`, then `bundle exec rake test`.
