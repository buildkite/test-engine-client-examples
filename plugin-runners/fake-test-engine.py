#!/usr/bin/env python3
"""A local stand-in for the Test Engine API, for trying bktest runner plugins
without a Test Engine suite.

It answers the requests `bktest run` makes: it has no cached plans, asks bktest
to split every file into examples when the runner supports it, splits the tests
it is sent round-robin across the requested parallelism, and accepts run
metadata. Every request is appended to the log file as one JSON line, so a run
can be checked afterwards: which runner name bktest sent, which tests, and the
run's statistics.

Usage: fake-test-engine.py PORT LOG_FILE
"""

import json
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

PORT = int(sys.argv[1])
LOG = sys.argv[2]


def strip_prefix(path, prefix):
    if prefix and path.startswith(prefix):
        return path[len(prefix):].lstrip("/")
    return path


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def reply(self, status, body):
        data = json.dumps(body).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def record(self, body):
        with open(LOG, "a") as log:
            log.write(json.dumps({"method": self.command, "path": self.path.split("?")[0], "body": body}) + "\n")

    def do_GET(self):
        self.record(None)
        # No cached plan: bktest creates one.
        self.reply(404, {"message": "Not found"})

    def read_body(self):
        if self.headers.get("Transfer-Encoding", "").lower() != "chunked":
            return self.rfile.read(int(self.headers.get("Content-Length", 0)))
        data = b""
        while True:
            size = int(self.rfile.readline().split(b";")[0], 16)
            if size == 0:
                self.rfile.readline()
                return data
            data += self.rfile.read(size)
            self.rfile.readline()

    def do_POST(self):
        body = json.loads(self.read_body() or b"{}")
        self.record(body)
        path = self.path.split("?")[0]
        if path.endswith("/test_plan/filter_tests"):
            # Split every file into examples.
            return self.reply(200, {"tests": [{"path": f["path"]} for f in body.get("files", [])]})
        if path.endswith("/test_plan"):
            return self.reply(200, self.plan(body))
        if path.endswith("/test_plan_metadata"):
            return self.reply(200, {})
        self.reply(404, {"message": "Not found"})

    def plan(self, body):
        parallelism = max(1, body.get("parallelism") or 1)
        prefix = body.get("location_prefix", "")
        tests = []
        for selector in body["tests"].get("selectors", []):
            value = strip_prefix(selector["value"], prefix)
            tests.append({"format": "selector", "value": value, "path": value})
        for example in body["tests"].get("examples", []):
            tests.append(dict(example, format="example"))
        tasks = {str(i): {"node_number": i, "tests": []} for i in range(parallelism)}
        for i, test in enumerate(sorted(tests, key=lambda t: t["path"])):
            tasks[str(i % parallelism)]["tests"].append(test)
        return {"identifier": body["identifier"], "parallelism": parallelism, "tasks": tasks}


ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
