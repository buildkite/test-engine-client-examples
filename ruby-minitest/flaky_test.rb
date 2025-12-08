require "minitest/autorun"
require_relative "test_helper"

class FlakyTest < Minitest::Test
  def test_it_flakes
    assert_operator rand, :<=, 0.8
  end
end
