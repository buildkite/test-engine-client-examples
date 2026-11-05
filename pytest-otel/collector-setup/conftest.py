from contextlib import closing
import sqlite3

from opentelemetry.instrumentation.sqlite3 import SQLite3Instrumentor
from opentelemetry.instrumentation.urllib import URLLibInstrumentor
import pytest

# Instrument before the session starts; let the collector own the provider.
SQLite3Instrumentor().instrument()
URLLibInstrumentor().instrument()


@pytest.fixture
def cursor():
    with closing(sqlite3.connect(":memory:")) as connection:
        with closing(connection.cursor()) as cursor:
            yield cursor
