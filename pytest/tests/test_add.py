import pytest

@pytest.mark.execution_tag("custom.tag.from", "test decorator")
def test_add():
    assert 1 + 1 == 2
