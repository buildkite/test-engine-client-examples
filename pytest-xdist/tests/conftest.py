import pytest

def pytest_itemcollected(item):
  # add execution tag to all tests
  item.add_marker(pytest.mark.execution_tag("test.framework.name", "pytest"))
  item.add_marker(pytest.mark.execution_tag("test.framework.version", pytest.__version__))
  item.add_marker(pytest.mark.execution_tag("test.framework.xdist", "true"))

  # prepend this marker so it doesn't override the mark set in test decorator
  item.add_marker(pytest.mark.execution_tag("custom.tag.from", "hook"), False)
