import os

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


def pytest_itemcollected(item):
    item.add_marker(pytest.mark.execution_tag("test.framework.name", "pytest"))
    item.add_marker(pytest.mark.execution_tag("test.framework.version", pytest.__version__))
    xdist_enabled = "true" if os.environ.get("PYTEST_XDIST_ENABLED") == "true" else "false"
    item.add_marker(pytest.mark.execution_tag("test.framework.xdist", xdist_enabled))
    item.add_marker(pytest.mark.execution_tag("custom.tag.from", "hook"), False)
