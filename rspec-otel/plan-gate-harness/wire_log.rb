require "net/http"
require "json"
require "digest"
require "zlib"
require "stringio"
require "google/rpc/status_pb"
require "opentelemetry/proto/collector/trace/v1/trace_service_pb"

# Observe the real exporter's HTTP requests; do not replace its transport,
# retry policy or response handling. The compatibility case only omits a header.
module WireLog
  def request(request, body = nil, &block)
    return super unless started? && request.path == "/v1/traces"

    request.delete("Buildkite-Tests-Span-Stream") if ENV.fetch("SCENARIO") == "unlabelled"
    payload = body || request.body
    decoded = request["Content-Encoding"] == "gzip" ? Zlib::GzipReader.new(StringIO.new(payload)).read : payload
    proto = Opentelemetry::Proto::Collector::Trace::V1::ExportTraceServiceRequest.decode(decoded)
    spans = proto.resource_spans.flat_map { |resource| resource.scope_spans.flat_map(&:spans) }
    response = super
    message = response.code == "403" ? Google::Rpc::Status.decode(response.body).message : nil
    entry = {
      stream: request["Buildkite-Tests-Span-Stream"] || "unlabelled",
      status: response.code.to_i,
      content_type: response["Content-Type"],
      message: message,
      sha256: Digest::SHA256.hexdigest(payload),
      spans: spans.map { |span| { name: span.name, id: span.span_id.unpack1("H*"), trace: span.trace_id.unpack1("H*") } },
    }
    File.open("artifacts/requests.jsonl", "a") { |file| file.puts(JSON.generate(entry)) }
    puts "WIRE stream=#{entry[:stream]} status=#{entry[:status]} spans=#{spans.size} message=#{message.inspect}"
    response
  end
end

Net::HTTP.prepend(WireLog)
