require "spec_helper"

RSpec.describe "A failed spec" do
  it "fails" do
    expect(true).to be false
  end
end
