import pytest


def pytest_itemcollected(item):
    # Tag every execution so these uploads are identifiable in Test Engine
    # (all the examples in this repo report to the same suite).
    item.add_marker(pytest.mark.execution_tag("test.framework.name", "pytest"))
    item.add_marker(pytest.mark.execution_tag("test.framework.version", pytest.__version__))
    item.add_marker(pytest.mark.execution_tag("build.tool", "pants"))
