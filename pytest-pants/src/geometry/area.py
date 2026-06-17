"""Geometry helpers.

First-level dependency: this module imports ``calc.arithmetic``. Pants infers
the dependency on the ``calc`` target automatically from the import below.
"""

from calc.arithmetic import multiply


def rectangle_area(width: float, height: float) -> float:
    return multiply(width, height)


def square_area(side: float) -> float:
    return rectangle_area(side, side)
