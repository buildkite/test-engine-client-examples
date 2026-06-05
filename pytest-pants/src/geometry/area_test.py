from geometry.area import rectangle_area, square_area


def test_rectangle_area():
    assert rectangle_area(4, 3) == 12


def test_square_area():
    assert square_area(5) == 25
