from textutils.slug import slugify, titlecase


def test_slugify():
    assert slugify("Hello World Example") == "hello-world-example"


def test_titlecase():
    assert titlecase("the quick brown fox") == "The Quick Brown Fox"
