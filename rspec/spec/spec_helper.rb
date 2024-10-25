require 'buildkite/test_collector'

# Configure the test collector to send the test results to Buildkite Test Engine
# See https://buildkite.com/docs/test-engine/ruby-collectors
Buildkite::TestCollector.configure(hook: :rspec)
