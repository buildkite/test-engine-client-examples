require "json"
require "fileutils"
require "open3"
require "set"

scenario = ARGV.fetch(0)
raise "Unknown scenario" unless %w[legacy entitled unlabelled].include?(scenario)
mode = ENV.fetch("RECEIVER_MODE")
raise "RECEIVER_MODE must be baseline or fixed" unless %w[baseline fixed].include?(mode)
ENV.fetch("BUILDKITE_ANALYTICS_OTLP_ENDPOINT")
ENV["BUILDKITE_TESTS_OTLP_TOKEN"] = ENV.fetch(scenario == "entitled" ? "ENTITLED_SUITE_TOKEN" : "LEGACY_SUITE_TOKEN")
ENV["SCENARIO"] = scenario
ENV["BUILDKITE_ANALYTICS_KEY"] = "te7833-#{ENV.fetch('BUILDKITE_BUILD_ID', 'local')}-#{scenario}"
ENV["BUILDKITE_TESTS_OTEL_CHILD_SPAN_QUEUE_SIZE"] = "8192"
ENV.delete("BUILDKITE_ANALYTICS_TOKEN")
ENV.delete("BUILDKITE_TESTS_OTLP_RELAY")
FileUtils.mkdir_p("artifacts")
FileUtils.rm_f("artifacts/requests.jsonl")
log = +""
status = nil
File.open("artifacts/collector.log", "w") do |file|
  Open3.popen2e("bundle", "exec", "rspec", "spec/plan_gate_spec.rb", "--format", "progress", "--format", "json", "--out", "artifacts/rspec.json") do |stdin, output, process|
    stdin.close
    output.each_line { |line| print line; file.write(line); log << line }
    status = process.value
  end
end
raise "RSpec failed" unless status.success?
summary = JSON.parse(File.read("artifacts/rspec.json")).fetch("summary")
raise "Wrong example count" unless summary.fetch("example_count") == 1_000 && summary.fetch("failure_count").zero?
requests = File.readlines("artifacts/requests.jsonl").map { |line| JSON.parse(line) }
old_message = "OTel trace ingest is not available on your organization's plan"
child_message = "Your organization's plan doesn't include OTel child spans, so this request wasn't stored. Test results are still accepted."
requests.each do |request|
  rejected = scenario != "entitled" && (mode == "baseline" || (scenario == "legacy" && request.fetch("stream") == "child"))
  raise "Wrong HTTP status: #{request}" unless request.fetch("status") == (rejected ? 403 : 200)
  raise "Not binary OTLP" unless request.fetch("content_type") == "application/x-protobuf"
  if rejected
    expected_message = mode == "baseline" ? old_message : child_message
    raise "Wrong refusal message" unless request.fetch("message") == expected_message && log.include?(expected_message)
  end
end
spans = requests.flat_map { |request| request.fetch("spans") }
tests = spans.select { |span| span.fetch("name") == "test.execution" }.uniq { |span| span.fetch("id") }
children = spans.select { |span| span.fetch("name").start_with?("te7833-child-") }.uniq { |span| span.fetch("id") }
raise "Partial test or child export" unless tests.size == 1_000 && children.size == 1_000
raise "Wrong child names" unless children.map { |span| span.fetch("name") }.to_set == (1..1_000).map { |i| "te7833-child-#{i}" }.to_set
raise "Orphan child spans" unless children.map { |span| span.fetch("trace") }.to_set == tests.map { |span| span.fetch("trace") }.to_set
expected_streams = scenario == "unlabelled" ? ["unlabelled"] : %w[child test]
raise "Wrong streams" unless requests.map { |request| request.fetch("stream") }.uniq.sort == expected_streams
missing = mode == "baseline" && scenario != "entitled"
raise "Wrong missing-results warning" unless log.include?("TEST RESULTS MISSING") == missing
puts "PASS mode=#{mode} scenario=#{scenario} examples=1000 unique_test_spans=#{tests.size} unique_manual_children=#{children.size} results_missing=#{missing}"
puts JSON.pretty_generate(requests.group_by { |request| [request.fetch("stream"), request.fetch("status")] }.transform_keys { |key| key.join(":") }.transform_values { |group| { requests: group.size, spans: group.sum { |r| r.fetch("spans").size } } })
