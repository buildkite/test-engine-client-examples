# Run through the receiver checkout's bin/rails runner after CI finishes.
# HARNESS_JOURNAL is the narrow proxy's JSONL: run, stream, sha256, status,
# request_id. Never include Authorization or request bodies in that journal.
require "json"
require "digest"
require "zlib"
require "stringio"
require "set"
require "rdkafka"
require "opentelemetry/proto/collector/trace/v1/trace_service_pb"

prefix = ENV.fetch("HARNESS_RUN_PREFIX")
mode = ENV.fetch("RECEIVER_MODE")
journal = File.readlines(ENV.fetch("HARNESS_JOURNAL")).map { |line| JSON.parse(line) }
requests = journal.select { |request| request["run"]&.start_with?(prefix) }
raise "No matching requests" if requests.empty?
by_hash = requests.to_h { |request| [request.fetch("sha256"), request] }
raise "Duplicate HTTP payloads" unless by_hash.size == requests.size
consumer = Rdkafka::Config.new(
  "bootstrap.servers" => "localhost:9092",
  "group.id" => "te7833-evidence-#{Process.pid}",
  "enable.auto.commit" => false,
).consumer
topic = "ta-otlp-traces-inline"
# Snapshot the partition ends so a quiet topic is provably empty, rather
# than interpreting a short poll timeout as absence of records.
ends = (0..2).to_h { |partition| [partition, consumer.query_watermark_offsets(topic, partition).last] }
assignment = Rdkafka::Consumer::TopicPartitionList.new
assignment.add_topic_and_partitions_with_offsets(topic, (0..2).to_h { |partition| [partition, 0] })
consumer.assign(assignment)
positions = (0..2).to_h { |partition| [partition, 0] }
records = []
deadline = Process.clock_gettime(Process::CLOCK_MONOTONIC) + 30
begin
  until positions.all? { |partition, offset| offset >= ends.fetch(partition) }
    raise "Kafka snapshot did not drain" if Process.clock_gettime(Process::CLOCK_MONOTONIC) > deadline
    message = consumer.poll(1000)
    next unless message

    positions[message.partition] = message.offset + 1
    request = by_hash[Digest::SHA256.hexdigest(message.payload)]
    next unless request

    raise "Refused request reached Kafka" unless request.fetch("status") == 200
    expected_run = Analytics::Run.derive_uuid(message.headers.fetch("suite_uuid"), request.fetch("run"))
    raise "Wrong authenticated run" unless message.headers.fetch("run_uuid") == expected_run
    payload = message.headers["content_encoding"] == "gzip" ? Zlib::GzipReader.new(StringIO.new(message.payload)).read : message.payload
    proto = Opentelemetry::Proto::Collector::Trace::V1::ExportTraceServiceRequest.decode(payload)
    spans = proto.resource_spans.flat_map { |resource| resource.scope_spans.flat_map(&:spans) }
    records << { request: request, headers: message.headers, spans: spans }
  end
ensure
  consumer.close
end
expected = requests.select { |request| request.fetch("status") == 200 }.map { |request| request.fetch("sha256") }.sort
actual = records.map { |record| record.fetch(:request).fetch("sha256") }.sort
raise "Kafka record loss or duplication" unless actual == expected
%w[legacy entitled unlabelled].each do |scenario|
  sent = requests.select { |request| request.fetch("run") == "#{prefix}#{scenario}" }
  raise "Missing scenario #{scenario}" if sent.empty?
  stored = records.select { |record| record.fetch(:request).fetch("run") == "#{prefix}#{scenario}" }
  spans = stored.flat_map { |record| record.fetch(:spans) }
  tests = spans.select { |span| span.name == "test.execution" }
  children = spans.select { |span| span.name.start_with?("te7833-child-") }
  accepted_tests = mode == "fixed" || scenario == "entitled"
  accepted_children = scenario == "entitled" || (mode == "fixed" && scenario == "unlabelled")
  raise "Wrong stored test count" unless tests.size == (accepted_tests ? 1000 : 0)
  raise "Duplicate test IDs" unless tests.map(&:span_id).uniq.size == tests.size
  raise "Wrong stored child count" unless children.size == (accepted_children ? 1000 : 0)
  raise "Duplicate child IDs" unless children.map(&:span_id).uniq.size == children.size
  if accepted_children
    raise "Child trace relationship lost" unless children.map(&:trace_id).to_set == tests.map(&:trace_id).to_set
  end
  puts JSON.generate(scenario: scenario, organizations: stored.map { |r| r.fetch(:headers).fetch("organization_uuid") }.uniq,
    http: sent.group_by { |request| [request.fetch("stream"), request.fetch("status")].join(":") }.transform_values(&:size),
    kafka_records: stored.group_by { |record| record.fetch(:request).fetch("stream") }.transform_values(&:size),
    test_results: tests.size, manual_children: children.size, all_spans: spans.size)
end
puts "PASS Kafka snapshot #{ends.inspect}: every accepted HTTP payload stored once, every refused payload absent"
