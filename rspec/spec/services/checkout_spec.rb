require "spec_helper"

RSpec.describe "Checkout" do
  it "totals the cart" do
    cart = [10, 20, 30]
    expect(cart.sum).to eq(60)
  end

  it "applies free shipping for large orders" do
    total = 150
    shipping = total > 100 ? 0 : 10
    expect(shipping).to eq(0)
  end

  it "charges shipping for small orders" do
    total = 50
    shipping = total > 100 ? 0 : 10
    expect(shipping).to eq(10)
  end
end
