# frozen_string_literal: true

require "rspec/version"

require "opentelemetry/instrumentation/active_record"
require "opentelemetry/instrumentation/net/http"
require "opentelemetry/instrumentation/redis"

require "buildkite/test_collector"

# The test collector initializes the OpenTelemetry SDK and installs the
# instrumentations registered above because the suite has not configured a provider.
Buildkite::TestCollector.configure(
  hook: :rspec,
  otel_enabled: true,
  tags: {
    "test.framework.name" => "rspec",
    "test.framework.version" => RSpec::Version::STRING,
    "custom.tag.from" => "upload",
  },
)
