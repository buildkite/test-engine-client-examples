require "spec_helper"

RSpec.describe "User" do
  it "has a name" do
    OpenTelemetry.tracer_provider.tracer("rspec-example").in_span("manual child span") do
      Buildkite::TestCollector.tag_execution("custom.tag.from", "execution")
      expect(true).to be true
    end
  end
end
