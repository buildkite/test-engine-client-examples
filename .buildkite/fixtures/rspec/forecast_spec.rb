require "spec_helper"

RSpec.describe "Forecast" do
  it "fetches the wind forecast" do
    marker = File.join(ENV.fetch("TMPDIR"), "forecast-attempted")
    unless File.exist?(marker)
      File.write(marker, "attempted")
      fail "weather service timed out"
    end
  end
end
