require "buildkite/test_collector"
require "cucumber"

# Configure the test collector to send the test results to Buildkite Test Engine
# See https://buildkite.com/docs/test-engine/ruby-collectors
Buildkite::TestCollector.configure(
  hook: :cucumber,
  tags: {
    "test.framework.name" => "cucumber",
    "test.framework.version" => Cucumber::VERSION,
    "custom.tag.from" => "upload",
  },
)
