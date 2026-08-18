# frozen_string_literal: true

require "active_record"
require "net/http"
require "redis"
require "rspec/version"

require "buildkite/test_collector"

Buildkite::TestCollector.configure(
  hook: :rspec,
  tags: {
    "test.framework.name" => "rspec",
    "test.framework.version" => RSpec::Version::STRING,
    "custom.tag.from" => "upload",
  },
)
