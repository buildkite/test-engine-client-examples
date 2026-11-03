#!/usr/bin/env python3
"""Local receiver double, NOT production. Persist accepted test spans for comparison."""
import gzip
import json
import os
from pathlib import Path
import subprocess
import sys
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

# buildkite/buildkite #37807, head 617cb73ab6b0f374be7b9ea5e78dd9e28d810597:
# traces_controller.rb require_otel_traces_feature, concerns/otlp_endpoint.rb
# render_error, and traces_spec.rb expect_otlp_error. reason is a metric tag,
# NOT an ErrorInfo detail in the wire body. Status(code: 7, message: ...) is:
MESSAGE = b"Your organization's plan doesn't include OTel child spans, so this request wasn't stored. Test results are still accepted."
REFUSAL = b"\x08\x07\x12" + bytes([len(MESSAGE)]) + MESSAGE
CONTENT_TYPE = "application/x-protobuf"


def fields(data):
    """Decode protobuf wire fields without installing packages on the CI image."""
    offset = 0

    def varint():
        nonlocal offset
        value = shift = 0
        while True:
            byte = data[offset]
            offset += 1
            value |= (byte & 127) << shift
            if byte < 128:
                return value
            shift += 7

    while offset < len(data):
        tag = varint()
        wire = tag & 7
        if wire == 0:
            value = varint()
        else:
            size = varint() if wire == 2 else {1: 8, 5: 4}[wire]
            value = data[offset:offset + size]
            offset += size
        yield tag >> 3, value


def spans(data):
    # ExportTraceServiceRequest.resource_spans.scope_spans.spans
    for resource in (v for k, v in fields(data) if k == 1):
        for scope in (v for k, v in fields(resource) if k == 2):
            for raw in (v for k, v in fields(scope) if k == 2):
                span = dict(fields(raw))
                attributes = {}
                for key, value in fields(raw):
                    if key == 9:
                        pair = dict(fields(value))
                        attributes[pair[1].decode()] = dict(fields(pair[2])).get(1, b"").decode()
                yield {"trace_id": span[1].hex(), "span_id": span[2].hex(),
                       "name": span[5].decode(), "attributes": attributes}


def main():
    directory = Path("swift-xcuitest/artifacts/stub")
    directory.mkdir(parents=True, exist_ok=True)
    (directory / "refusal.pb").write_bytes(REFUSAL)
    records = []
    lock = threading.Lock()

    class Receiver(BaseHTTPRequestHandler):
        def do_POST(self):
            body = self.rfile.read(int(self.headers["Content-Length"]))
            if self.headers.get("Content-Encoding") == "gzip":
                body = gzip.decompress(body)
            stream = self.headers.get("Buildkite-Tests-Span-Stream")
            assert self.path == "/v1/traces", self.path
            assert stream in ("test", "child"), stream
            status = 403 if stream == "child" else 200
            decoded = list(spans(body))
            with lock:
                records.append({"stream": stream, "status": status,
                                "reason": "plan_missing_feature" if status == 403 else None,
                                "spans": decoded})
                (directory / "requests.json").write_text(json.dumps(records, indent=2))
            self.send_response(status)
            self.send_header("Content-Type", CONTENT_TYPE)
            response = REFUSAL if status == 403 else b""
            self.send_header("Content-Length", str(len(response)))
            self.end_headers()
            self.wfile.write(response)

        def log_message(self, *_):
            pass

    server = ThreadingHTTPServer(("127.0.0.1", 0), Receiver)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    env = dict(os.environ, ARLO_STUB_ACTIVE="true", BUILDKITE_ANALYTICS_TOKEN="stub-not-a-secret",
               BUILDKITE_ANALYTICS_OTLP_ENDPOINT=f"http://127.0.0.1:{server.server_port}/v1/traces")
    for key in list(env):
        if key.startswith("OTEL_") or key.startswith("TEST_RUNNER_") or key == "BUILDKITE_TESTS_OTLP_TOKEN":
            del env[key]
    try:
        result = subprocess.run(sys.argv[1:], env=env)
    finally:
        server.shutdown()
        server.server_close()

    accepted = [span for r in records if r["stream"] == "test" for span in r["spans"]]
    names = sorted(s["attributes"]["buildkite.test.name"] for s in accepted)
    expected = sorted(["test01AppLaunches", "test02ExecutionTag", "test04RunsInReplacementRunner", "test05ExecutionTagAfterRestart"])
    print("STUB NOT PROD: accepted completed test names:", names)
    print("STUB NOT PROD: refused child requests:", sum(r["status"] == 403 for r in records))
    assert names == expected, (names, expected)
    assert len({s["span_id"] for s in accepted}) == 4
    assert any(r["status"] == 403 for r in records)
    assert all(s["name"] == "test.execution" for s in accepted)
    return result.returncode


if __name__ == "__main__":
    sys.exit(main())
