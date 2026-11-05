from opentelemetry.instrumentation.sqlite3 import SQLite3Instrumentor
import pytest

from inventory import Inventory

# Instrument before the session starts; let the collector own the provider.
SQLite3Instrumentor().instrument()


@pytest.fixture
def inventory():
    store = Inventory({"widget": 7, "bolt": 11})
    yield store
    store.close()
