# frozen_string_literal: true

require "rspec/version"

require "opentelemetry/exporter/otlp"
require "opentelemetry/sdk"
require "opentelemetry/instrumentation/active_record"
require "opentelemetry/instrumentation/net/http"

require "buildkite/test_collector"

# This provider has no exporter of its own. Without this, the SDK adds a default
# OTLP exporter that bktec's relay variables point at Test Engine, so spans are
# sent twice.
ENV["OTEL_TRACES_EXPORTER"] = "none"

# Register this hook before configuring the collector, which attaches to the
# suite's provider in its own before(:suite) hook.
RSpec.configure do |config|
  config.before(:suite) do
    # Configure OTel SDK in the before(:suite) hook to ensure all instrumented libraries
    # are loaded before the instrumentation is initialized. Otherwise, the instrumentation
    # may not be able to patch the libraries and will not produce spans.
    OpenTelemetry::SDK.configure do |config|
      config.service_name = "rspec-otel-example"
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
