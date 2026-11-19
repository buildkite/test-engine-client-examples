require "buildkite/test_collector"

Buildkite::TestCollector.configure(
  hook: :minitest,
  tags: {
    "test.framework.name" => "minitest",
    "test.framework.version" => Minitest::VERSION,
    "custom.tag.from" => "upload",
  },
)
