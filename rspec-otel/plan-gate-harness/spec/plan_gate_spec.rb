require "rspec/version"
require "buildkite/test_collector"
require_relative "../wire_log"

Buildkite::TestCollector.configure(hook: :rspec, otel_enabled: true)

RSpec.describe "TE-7833 plan gate", order: :defined do
  # Keep refused batches below the SDK's fail-fast flush boundary so even
  # the baseline attempts all 1,000 results, rather than abandoning its tail.
  unless ENV.fetch("SCENARIO") == "legacy-stock"
    after do |example|
      Buildkite::TestCollector::OTel.force_flush if (example.metadata.fetch(:harness_index) + 1) % 50 == 0
    end
  end

  1_000.times do |index|
    it "preserves result #{index + 1}", harness_index: index do
      tracer = OpenTelemetry.tracer_provider.tracer("te7833-harness")
      tracer.in_span("te7833-child-#{index + 1}") do |span|
        expect(span.recording?).to be(true)
        expect(OpenTelemetry::Trace.current_span.context.trace_id).to eq(
          Buildkite::TestCollector::OTel.current_test_span.context.trace_id,
        )
      end
    end
  end
end
