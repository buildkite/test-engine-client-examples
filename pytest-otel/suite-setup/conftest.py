from contextlib import closing
import sqlite3

from opentelemetry import trace
from opentelemetry.instrumentation.sqlite3 import SQLite3Instrumentor
from opentelemetry.instrumentation.urllib import URLLibInstrumentor
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
import pytest

# Configure at import time, before the collector attaches at pytest session start.
trace.set_tracer_provider(
    TracerProvider(resource=Resource.create({"service.name": "pytest-otel-example"}))
)
SQLite3Instrumentor().instrument()
URLLibInstrumentor().instrument()


@pytest.fixture
def cursor():
    with closing(sqlite3.connect(":memory:")) as connection:
        with closing(connection.cursor()) as cursor:
            yield cursor
