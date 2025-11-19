import pytest

# Global variable to track execution count
execution_count = 0

@pytest.mark.flaky(reruns=1)
def test_flaky():
    """
    This test is marked to be rerun 1 time if it fails.
    It fails the first time and passes the second time.
    """
    global execution_count
    execution_count += 1
    
    if execution_count == 1:
        assert False, "This is a simulated failure on the first attempt"
    
    assert True
