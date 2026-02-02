require "minitest/autorun"
require_relative "test_helper"

class ExampleTest < Minitest::Test
  def test_it_works
    Buildkite::TestCollector.tag_execution("custom.tag.from", "execution")
    assert_equal true, true
  end

  def test_it_fails
    assert_equal true, false
  end
end
