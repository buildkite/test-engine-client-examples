require "minitest/autorun"

require "buildkite/test_collector"
Buildkite::TestCollector.configure(
  hook: :minitest,
  url: ENV["BUILDKITE_ANALYTICS_ENDPOINT"], # https://github.com/buildkite/test-collector-ruby/pull/239
  tags: {
    "test.framework.name" => "minitest",
    "test.framework.version" => Minitest::VERSION,
    "custom.tag.from" => "upload",
  },
)

class ExampleTest < Minitest::Test
  def test_it_works
    Buildkite::TestCollector.tag_execution("custom.tag.from", "execution")
    assert_equal true, true
  end

  def test_it_fails
    assert_equal true, false
  end

  def test_it_flakes
    assert_operator rand, :<=, 0.8
  end
end
