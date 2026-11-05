from http.server import BaseHTTPRequestHandler, HTTPServer
from threading import Thread
from urllib.request import urlopen

from opentelemetry import trace
import pytest

pytestmark = pytest.mark.execution_tag("component", "otel")
tracer = trace.get_tracer("example.otel")


def test_sql_queries(cursor):
    with tracer.start_as_current_span("create_and_find_widget"):
        cursor.execute("CREATE TABLE widgets (id INTEGER PRIMARY KEY, name TEXT)")
        cursor.execute("INSERT INTO widgets (name) VALUES (?)", ("instrumented",))
        row = cursor.execute("SELECT name FROM widgets WHERE id = ?", (1,)).fetchone()
        assert row == ("instrumented",)


class HealthHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-Length", "2")
        self.end_headers()
        self.wfile.write(b"OK")


def test_http_request():
    with HTTPServer(("127.0.0.1", 0), HealthHandler) as server:
        thread = Thread(target=server.serve_forever)
        thread.start()
        try:
            with urlopen(f"http://127.0.0.1:{server.server_port}/health", timeout=2) as response:
                assert response.status == 200
                assert response.read() == b"OK"
        finally:
            server.shutdown()
            thread.join()


def test_failed_query(cursor):
    # Deliberate failure to demonstrate test and child-span error reporting.
    cursor.execute("SELECT * FROM missing_table")
