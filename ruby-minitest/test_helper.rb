require "buildkite/test_collector"

Buildkite::TestCollector.configure(
  hook: :minitest,
  url: ENV["BUILDKITE_ANALYTICS_ENDPOINT"], # https://github.com/buildkite/test-collector-ruby/pull/239
  tags: {
    "test.framework.name" => "minitest",
    "test.framework.version" => Minitest::VERSION,
    "custom.tag.from" => "upload",
  },
)
