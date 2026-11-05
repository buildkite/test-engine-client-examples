require "spec_helper"

RSpec.describe "Product" do
  it "has a name" do
    expect("Buildkite T-shirt").to start_with("Buildkite")
  end

  it "has a price" do
    expect(25.0).to be > 0
  end

  it "applies a discount" do
    price = 100.0
    discounted = price * 0.9
    expect(discounted).to eq(90.0)
  end
end
