require "spec_helper"

RSpec.describe "A failed spec" do
  it "fails" do
    OpenTelemetry.tracer_provider.tracer("rspec-example").in_span("manual child span") do
      expect(true).to be false
    end
  end
end
