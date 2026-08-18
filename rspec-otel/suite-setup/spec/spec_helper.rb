# frozen_string_literal: true

require "active_record"
require "net/http"
require "redis"
require "rspec/version"

require "opentelemetry/sdk"
require "opentelemetry/instrumentation/active_record"
require "opentelemetry/instrumentation/net/http"

# The suite initializes the SDK and installs explicit instrumentations before the
# test collector adds the Buildkite span processor. Redis is intentionally omitted
# to demonstrate that calls without installed instrumentation do not create spans.
OpenTelemetry::SDK.configure do |config|
  config.use "OpenTelemetry::Instrumentation::ActiveRecord"
  config.use "OpenTelemetry::Instrumentation::Net::HTTP"
end

require "buildkite/test_collector"

Buildkite::TestCollector.configure(
  hook: :rspec,
  otel_enabled: true,
  tags: {
    "test.framework.name" => "rspec",
    "test.framework.version" => RSpec::Version::STRING,
    "custom.tag.from" => "upload",
  },
)
