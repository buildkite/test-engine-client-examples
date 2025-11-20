import pytest

def test_dynamic_skip():
    pytest.skip("Skipping this test dynamically using pytest.skip()")

@pytest.mark.xfail(reason="This test is expected to fail")
def test_xfail_example():
    assert False
