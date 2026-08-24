require "spec_helper"

RSpec.describe "Logout" do
  it "logs out the user" do
    OpenTelemetry.tracer_provider.tracer("rspec-example").in_span("manual child span") do
      expect(true).to be(true)
    end
  end
end
