require "spec_helper"

RSpec.describe "Flight checks" do
  describe "Wind" do
    [[25, true], [5, false], [60, false]].each do |speed, safe|
      it "#{safe ? 'accepts' : 'rejects'} #{speed} km/h" do
        expect(Workshop.wind_safe?(speed)).to eq(safe)
      end
    end
  end
end
