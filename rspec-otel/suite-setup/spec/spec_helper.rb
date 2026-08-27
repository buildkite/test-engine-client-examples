# frozen_string_literal: true

require "rspec/version"

require "opentelemetry/exporter/otlp"
require "opentelemetry/sdk"
require "opentelemetry/instrumentation/active_record"
require "opentelemetry/instrumentation/net/http"

require "buildkite/test_collector"

RSpec.configure do |config|
  config.before(:suite) do
    # Configure OTel SDK in the before(:suite) hook to ensure all instrumented libraries
    # are loaded before the instrumentation is initialized. Otherwise, the instrumentation 
    # may not be able to patch the libraries and will not produce spans.
    OpenTelemetry::SDK.configure do |config|
      config.use "OpenTelemetry::Instrumentation::ActiveRecord"
      config.use "OpenTelemetry::Instrumentation::Net::HTTP"
    end
  end
end

Buildkite::TestCollector.configure(
  hook: :rspec,
  otel_enabled: true,
  tags: {
    "test.framework.name" => "rspec",
    "test.framework.version" => RSpec::Version::STRING,
    "custom.tag.from" => "upload",
  },
)
