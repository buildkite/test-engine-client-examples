require 'buildkite/test_collector'
require "rspec/version"

# Configure the test collector to send the test results to Buildkite Test Engine
# See https://buildkite.com/docs/test-engine/ruby-collectors
Buildkite::TestCollector.configure(
  hook: :rspec,
  otel_only: true,
  token: ENV["BUILDKITE_TESTS_OTLP_TOKEN"],
  tags: {
    "test.framework.name" => "rspec",
    "test.framework.version" => RSpec::Version::STRING,
    "custom.tag.from" => "upload",
  },
)
