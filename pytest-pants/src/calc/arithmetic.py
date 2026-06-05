"""Core arithmetic helpers.

This is a leaf module: it has no dependencies on any other module in the
codebase, which makes it a good illustration of a non-dependent Pants target.
"""


def add(a: float, b: float) -> float:
    return a + b


def subtract(a: float, b: float) -> float:
    return a - b


def multiply(a: float, b: float) -> float:
    return a * b
