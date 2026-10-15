def test_string_upper():
    assert "buildkite".upper() == "BUILDKITE"


def test_string_concat():
    assert "test" + "engine" == "testengine"


def test_string_strip():
    assert "  padded  ".strip() == "padded"
