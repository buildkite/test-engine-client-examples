require_relative "../lib/workshop"
require "buildkite/test_collector"
require "rspec/version"

# Configure the test collector to send the test results to Buildkite Test Engine
# See https://buildkite.com/docs/test-engine/ruby-collectors
Buildkite::TestCollector.configure(
  hook: :rspec,
  tags: {
    "test.framework.name" => "rspec",
    "test.framework.version" => RSpec::Version::STRING,
    "workshop.area" => "kite-building",
  },
)
