import pytest

class TestSubstract:
  @pytest.mark.repeat(3)
  def test_positive(self):
    assert 5 - 3 == 2

  def test_negative(self):
    assert 3 - 5 == -2

