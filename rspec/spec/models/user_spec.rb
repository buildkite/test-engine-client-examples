require "spec_helper"

RSpec.describe "User" do
  it "has a name" do
    Buildkite::TestCollector.tag_execution("custom.tag.from", "execution")
    expect(true).to be true
  end
end
