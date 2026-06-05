from calc.arithmetic import add, multiply, subtract


def test_add():
    assert add(1, 1) == 2


def test_subtract():
    assert subtract(5, 3) == 2


def test_multiply():
    assert multiply(4, 3) == 12
