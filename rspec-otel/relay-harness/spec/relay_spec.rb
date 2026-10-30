# frozen_string_literal: true

require "rspec/version"
require "buildkite/test_collector"

Buildkite::TestCollector.configure(
  hook: :rspec,
  otel_enabled: true,
  tags: {
    "test.framework.name" => "rspec",
    "test.framework.version" => RSpec::Version::STRING,
    "relay.harness" => "sparse-and-child",
  },
)

RSpec.describe "Ruby relay forwarding", order: :defined do
  # Batch size 1 makes collector requests observable promptly. Gaps exceed the
  # relay's one-second window even with the collector's one-second export tick.
  3.times do |index|
    it "forwards sparse test #{index + 1}" do
      sleep 2.5
      expect(index + 1).to be_between(1, 3)
    end
  end

  it "forwards a burst of 20 child requests without merging them" do
    sleep 1.5 # Let the last sparse test upload before introducing child traffic.
    tracer = OpenTelemetry.tracer_provider.tracer("relay-harness")
    20.times do |index|
      tracer.in_span("relay-child-#{index + 1}") do |span|
        span.set_attribute("relay.child.index", index + 1)
        expect(span.recording?).to be(true)
      end
      # The collector's public flush completes the local HTTP export, not the
      # relay's upstream delivery. This yields separate, closely spaced requests.
      Buildkite::TestCollector::OTel.force_flush
    end
  end
end
