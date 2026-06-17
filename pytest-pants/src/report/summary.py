"""Reporting helpers.

Second-level dependency: this module imports ``geometry.area``, which in turn
depends on ``calc.arithmetic``. Pants infers the full transitive dependency
graph (report -> geometry -> calc) from the imports.
"""

from geometry.area import rectangle_area, square_area


def area_summary(rectangles: list[tuple[float, float]], squares: list[float]) -> str:
    total = 0.0
    for width, height in rectangles:
        total += rectangle_area(width, height)
    for side in squares:
        total += square_area(side)
    count = len(rectangles) + len(squares)
    return f"Total area across {count} shapes: {total:g}"
