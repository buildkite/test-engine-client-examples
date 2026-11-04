"""Dogfood the installed collector against loopback receivers, never Test Engine."""

import argparse
import ast
from collections import Counter
import gzip
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import os
from pathlib import Path
import re
import subprocess
import sys
from tempfile import TemporaryDirectory
from threading import Thread
from uuid import uuid4

from opentelemetry.proto.collector.trace.v1.trace_service_pb2 import ExportTraceServiceRequest


CONTROL_EXPECTED = {
    ("tests/failed_test.py", "test_failed"): "failed",
    ("tests/test_add.py", "test_add"): "passed",
    ("tests/test_dynamic_skip_and_xfail.py", "test_dynamic_skip"): "skipped",
    ("tests/test_dynamic_skip_and_xfail.py", "test_xfail_example"): "skipped",
    ("tests/test_skipped.py", "test_skipped_example"): "skipped",
    ("tests/test_substract.py::TestSubstract", "test_positive"): "passed",
    ("tests/test_substract.py::TestSubstract", "test_negative"): "passed",
}
INVENTORY_EXPECTED = {
    ("tests/test_inventory.py", "test_reserve_stock[widget-3-4]"): "passed",
    ("tests/test_inventory.py", "test_reserve_stock[bolt-11-0]"): "passed",
    ("tests/test_inventory.py", "test_invalid_reservation[0]"): "passed",
    ("tests/test_inventory.py", "test_invalid_reservation[8]"): "passed",
    ("tests/test_inventory.py", "test_missing_product"): "failed",
}
ROOT = Path(__file__).resolve().parent
SUITES = {
    "controls": (ROOT.parent / "pytest", CONTROL_EXPECTED),
    "inventory": (ROOT, INVENTORY_EXPECTED),
}


def attributes(values):
    return {item.key: getattr(item.value, item.value.WhichOneof("value")) for item in values}


def check_results(results, xdist, suite):
    directory, expected = SUITES[suite]
    assert len(results) == len(expected), results
    assert {(test["scope"], test["name"]): test["result"] for test in results} == expected
    for test in results:
        tags = test["tags"]
        assert tags["test.framework.name"] == "pytest"
        assert tags["test.framework.xdist"] == str(xdist).lower()
        assert tags["custom.tag.from"] == (
            "test decorator" if test["name"].startswith(("test_add", "test_reserve_stock")) else "hook"
        )
        if suite == "inventory":
            assert tags["component"] == "inventory"
        # Check the source, not just agreement between two collector transports.
        path, line = test["location"].rsplit(":", 1)
        assert path == test["file_name"]
        function = next(node for node in ast.walk(ast.parse((directory / path).read_text()))
                        if isinstance(node, ast.FunctionDef)
                        and node.name == test["name"].partition("[")[0])
        assert int(line) == min(node.lineno for node in [function, *function.decorator_list])
    failed = next(test for test in results if test["result"] == "failed")
    if suite == "controls":
        assert "assert (1 + 1) == 10" in failed["failure_reason"]
        assert "tests/failed_test.py:2" in str(failed["failure_expanded"])
    else:
        assert "Unknown product: missing" in failed["failure_reason"]
        assert "inventory.py:" in str(failed["failure_expanded"])


def check_spans(requests, baseline, key, suite):
    assert requests and all(path == "/v1/traces" for path, _, _ in requests), requests
    spans = []
    for _, headers, body in requests:
        assert headers["Buildkite-Tests-Run-Key"] == key
        stream = headers["Buildkite-Tests-Span-Stream"]
        assert stream in ("test", "child")
        message = ExportTraceServiceRequest.FromString(body)
        for resource in message.resource_spans:
            for scope in resource.scope_spans:
                for span in scope.spans:
                    assert (span.name == "test.execution") == (stream == "test")
                    spans.append(span)
    assert len({span.span_id for span in spans}) == len(spans), "duplicate span uploads"
    tests = [span for span in spans if span.name == "test.execution"]
    assert len(tests) == len({span.trace_id for span in tests}) == len(baseline)
    assert len({attributes(span.attributes)["buildkite.test.execution.external_id"]
                for span in tests}) == len(baseline)
    results = {}
    for span in tests:
        attrs = attributes(span.attributes)
        identity = (attrs["buildkite.test.scope"], attrs["buildkite.test.name"])
        assert identity not in results, "duplicate execution"
        reference = baseline[identity]
        assert not span.parent_span_id
        assert attrs["test.case.name"] == "::".join(identity)
        assert attrs["code.file.path"] == reference["file_name"]
        assert attrs["code.line.number"] == int(reference["location"].rsplit(":", 1)[1])
        assert attrs["buildkite.run_key"] == key
        assert attrs["buildkite.execution.via"] == "otlp"
        tags = {name.removeprefix("buildkite.tag."): value for name, value in attrs.items()
                if name.startswith("buildkite.tag.")}
        assert tags == reference["tags"], tags
        result = {"pass": "passed", "fail": "failed", "skipped": "skipped"}[
            attrs["test.case.result.status"]
        ]
        results[identity] = result
        assert (span.status.code == 2) == (result == "failed")
        if result == "failed":
            assert span.status.message == reference["failure_reason"]
            exceptions = [attributes(event.attributes) for event in span.events
                          if event.name == "exception"]
            assert len(exceptions) == len(reference["failure_expanded"]) == 1
            failure = reference["failure_expanded"][0]
            # Separate pytest processes include different object addresses in local reprs.
            address = r" object at 0x[0-9a-f]+>"
            assert re.sub(address, " object at ADDRESS>", exceptions[0]["exception.message"]) == re.sub(
                address, " object at ADDRESS>", "\n".join(failure["expanded"])
            )
            assert exceptions[0]["exception.stacktrace"] == "\n".join(failure["backtrace"])

        children = [child for child in spans if child.trace_id == span.trace_id and child != span]
        if suite == "controls":
            assert not children
            continue
        check_inventory_trace(span, children, identity[1])
    assert results == SUITES[suite][1]
    # Reject orphan spans, including spans attached to an unrelated test/trace.
    assert all(child.trace_id in {test.trace_id for test in tests} for child in spans)
    return len(spans) - len(tests)


def check_inventory_trace(test, children, name):
    by_id = {span.span_id: span for span in [test, *children]}
    phases = [span for span in children if span.name.startswith("test.")]
    assert Counter(span.name for span in phases) == {
        "test.setup": 1, "test.body": 1, "test.teardown": 1,
    }
    assert all(phase.parent_span_id == test.span_id for phase in phases)
    for child in children:
        parent = by_id[child.parent_span_id]
        assert parent.start_time_unix_nano <= child.start_time_unix_nano
        assert child.end_time_unix_nano <= parent.end_time_unix_nano
        if child.name in ("inventory.open", "inventory.close", "inventory.reserve"):
            phase = {"inventory.open": "test.setup", "inventory.close": "test.teardown",
                     "inventory.reserve": "test.body"}[child.name]
            assert parent.name == phase
        elif child.name == "inventory.lookup":
            assert parent.name in ("inventory.reserve", "test.body")

    reserves = [span for span in children if span.name == "inventory.reserve"]
    assert len(reserves) == 1
    reserve = reserves[0]
    success = name.startswith("test_reserve_stock")
    assert (reserve.status.code == 2) == (not success)
    if not success:
        error = "LookupError" if name == "test_missing_product" else "ValueError"
        events = [attributes(event.attributes) for event in reserve.events if event.name == "exception"]
        assert len(events) == 1 and events[0]["exception.type"] == error
        assert "inventory.py" in events[0]["exception.stacktrace"]
        # A handled application error must not make the test execution fail.
        assert (test.status.code == 2) == (name == "test_missing_product")
    lookups = [span for span in children if span.name == "inventory.lookup"]
    assert lookups
    for lookup in lookups:
        assert (lookup.status.code == 2) == (name == "test_missing_product")

    sql = [span for span in children if attributes(span.attributes).get("db.system") == "sqlite"]
    assert sql, "SQLite auto-instrumentation produced no database spans"
    statements = Counter(attributes(span.attributes)["db.statement"].split()[0] for span in sql)
    assert statements == {"CREATE": 1, "INSERT": 1, "SELECT": len(lookups), **({"UPDATE": 1} if success else {})}
    assert all(sum(query.parent_span_id == lookup.span_id for query in sql) == 1 for lookup in lookups)
    for query in sql:
        operation = attributes(query.attributes)["db.statement"].split()[0]
        parent = by_id[query.parent_span_id]
        assert parent.name == {"CREATE": "inventory.open", "INSERT": "inventory.open",
                               "SELECT": "inventory.lookup", "UPDATE": "inventory.reserve"}[operation]
    assert Counter(span.name for span in children if span.name.startswith("inventory.")) == {
        "inventory.open": 1, "inventory.close": 1, "inventory.reserve": 1,
        "inventory.lookup": len(lookups),
    }


def run_variant(mode, xdist, suite, bktec=None):
    directory, expected = SUITES[suite]
    requests = []

    class Receiver(BaseHTTPRequestHandler):
        def log_message(self, *_args):
            pass

        def do_GET(self):
            # Ask bktec to use its local fallback plan; no live scheduling API.
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b'{"tasks": {}}')

        def do_POST(self):
            body = self.rfile.read(int(self.headers["Content-Length"]))
            if self.headers.get("Content-Encoding") == "gzip":
                body = gzip.decompress(body)
            requests.append((self.path, self.headers, body))
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b"{}" if self.path.endswith("/uploads") else b"")

    with TemporaryDirectory(prefix="pytest-otel-") as temporary:
        server = ThreadingHTTPServer(("127.0.0.1", 0), Receiver)
        thread = Thread(target=server.serve_forever, daemon=True)
        thread.start()
        endpoint = f"http://127.0.0.1:{server.server_port}"
        key = f"python-{suite}-{mode}-{'xdist' if xdist else 'plain'}-{uuid4()}"
        result_path = Path(temporary) / "result.json"
        # Deliberately do not inherit real CI credentials, endpoints or SDK settings.
        env = {
            "PATH": str(Path(sys.executable).parent) + os.pathsep + os.environ["PATH"],
            "HOME": os.environ["HOME"],
            "BUILDKITE_ANALYTICS_TOKEN": "loopback-only",
            "BUILDKITE_ANALYTICS_KEY": key,
            "BUILDKITE_ANALYTICS_API_URL": endpoint + "/v1",
            "BUILDKITE_ANALYTICS_OTLP_ENDPOINT": endpoint + "/v1/traces",
            "BUILDKITE_ANALYTICS_OTEL_ENABLED": "false" if mode == "json" else "true",
            "PYTEST_XDIST_ENABLED": str(xdist).lower(),
        }
        command = [sys.executable, "-m", "pytest", "tests", f"--json={result_path}"]
        if xdist:
            command += ["-n", "3"]
        if bktec:
            agent = Path(temporary) / "buildkite-agent"
            agent.write_text('#!/bin/sh\n[ "$1" = oidc ] && [ "$2" = request-token ] || exit 1\nprintf "loopback-only\\n"\n')
            agent.chmod(0o700)
            env.update({
                "BUILDKITE_BUILD_ID": "loopback-build",
                "BUILDKITE_STEP_ID": "loopback-step",
                "BUILDKITE_ORGANIZATION_SLUG": "loopback",
                "BUILDKITE_TEST_ENGINE_SUITE_SLUG": "loopback",
                "BUILDKITE_TEST_ENGINE_BASE_URL": endpoint,
                "BUILDKITE_TEST_ENGINE_API_ACCESS_TOKEN": "loopback-only",
                "BUILDKITE_TESTS_OTLP_RELAY_UPSTREAM_ENDPOINT": endpoint + "/v1/traces",
                "PYTEST_ADDOPTS": "-n 3" if xdist else "",
            })
            command = [bktec, "run", "--test-runner", "pytest", "--otlp-relay",
                       "--upload-results=false", "--result-path", str(result_path),
                       "--buildkite-agent-command", str(agent)]
        try:
            process = subprocess.run(command, cwd=directory, env=env, text=True,
                                     capture_output=True, timeout=90)
            assert process.returncode == 1, process.stdout + process.stderr
            assert "TEST RESULTS MISSING" not in process.stdout + process.stderr
            if bktec:
                assert "0 dropped permanently, 0 dropped at drain deadline" in process.stdout
            local = json.loads(result_path.read_text())
            assert len(local) == len(expected)
            assert {(test["scope"], test["name"]): test["result"] for test in local} == expected
            if mode == "json":
                assert requests and all(path == "/v1/uploads" for path, _, _ in requests)
                uploaded = [test for _, _, body in requests for test in json.loads(body)["data"]]
                check_results(uploaded, xdist, suite)
                print(f"PASS {key}: JSON executions {dict(Counter(test['result'] for test in uploaded))}")
                return {(test["scope"], test["name"]): test for test in uploaded}
            # --json is still a local bktec report, not a second upload.
            return key, requests
        finally:
            server.shutdown()
            server.server_close()
            thread.join()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--bktec", help="Also exercise this bktec binary's real relay with fake local OIDC")
    args = parser.parse_args()
    for suite in SUITES:
        for xdist in (False, True):
            baseline = run_variant("json", xdist, suite)
            for bktec in ([None, str(Path(args.bktec).resolve())] if args.bktec else [None]):
                key, requests = run_variant("otel", xdist, suite, bktec)
                children = check_spans(requests, baseline, key, suite)
                print(f"PASS {key}{' via bktec relay' if bktec else ''}: "
                      f"{len(baseline)} executions, {children} child/phase spans, "
                      "JSON parity, no duplicate/JSON uploads")


if __name__ == "__main__":
    main()
