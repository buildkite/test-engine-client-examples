"""String helpers.

Another non-dependent module: it shares no code with ``calc``, ``geometry`` or
``report``, demonstrating an independent target in the dependency graph.
"""


def slugify(text: str) -> str:
    return "-".join(text.lower().split())


def titlecase(text: str) -> str:
    return " ".join(word.capitalize() for word in text.split())
