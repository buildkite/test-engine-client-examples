import datetime
import hashlib
import http.client
import json
import os
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

EXPIRES = time.time() + 7200
JOURNAL = os.environ['HARNESS_JOURNAL']

class Handler(BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def do_POST(self):
        if self.path != '/v1/traces' or time.time() > EXPIRES:
            self.send_error(404)
            return
        body = self.rfile.read(int(self.headers.get('Content-Length', '0')))
        headers = {key: value for key, value in self.headers.items()
                   if key.lower() in ('authorization', 'content-type', 'content-encoding',
                                      'buildkite-tests-run-key', 'buildkite-tests-span-stream')}
        headers['Host'] = 'tests-otlp.buildkite.localhost:3000'
        connection = http.client.HTTPConnection('127.0.0.1', 3000, timeout=25)
        connection.request('POST', '/v1/traces', body, headers)
        response = connection.getresponse()
        data = response.read()
        with open(JOURNAL, 'a') as journal:
            journal.write(json.dumps(dict(time=datetime.datetime.now(datetime.timezone.utc).isoformat(),
                run=self.headers.get('Buildkite-Tests-Run-Key'),
                stream=self.headers.get('Buildkite-Tests-Span-Stream', 'unlabelled'),
                sha256=hashlib.sha256(body).hexdigest(), status=response.status,
                request_id=response.getheader('X-Request-Id'))) + '\n')
        self.send_response(response.status)
        self.send_header('Content-Type', response.getheader('Content-Type', 'application/x-protobuf'))
        self.send_header('Content-Length', str(len(data)))
        self.end_headers()
        self.wfile.write(data)
        connection.close()

    def do_GET(self):
        self.send_error(404)

ThreadingHTTPServer(('127.0.0.1', 3402), Handler).serve_forever()
