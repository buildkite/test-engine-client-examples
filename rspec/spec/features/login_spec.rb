require "spec_helper"

RSpec.describe "Login" do
  it "logs in a user" do
    OpenTelemetry.tracer_provider.tracer("rspec-example").in_span("manual child span") do
      sleep(1)
      expect(true).to be true
    end
  end

  it "redirects to the dashboard" do
    OpenTelemetry.tracer_provider.tracer("rspec-example").in_span("manual child span") do
      sleep(1)
      expect(true).to be true
    end
  end
end
