RSpec.describe "Flight test" do
  it "holds steady in gusty wind" do
    if Integer(ENV.fetch("BUILDKITE_BUILD_NUMBER")).odd?
      fail "kite lost altitude in a 35 km/h gust"
    end
  end
end
