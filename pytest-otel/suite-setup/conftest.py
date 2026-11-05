from opentelemetry import trace
from opentelemetry.instrumentation.sqlite3 import SQLite3Instrumentor
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
import pytest

from inventory import Inventory

# Configure at import time, before the collector attaches at pytest session start.
trace.set_tracer_provider(
    TracerProvider(resource=Resource.create({"service.name": "inventory-tests"}))
)
SQLite3Instrumentor().instrument()


@pytest.fixture
def inventory():
    store = Inventory({"widget": 7, "bolt": 11})
    yield store
    store.close()
