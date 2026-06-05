from report.summary import area_summary


def test_area_summary():
    summary = area_summary(rectangles=[(4, 3), (2, 5)], squares=[3])
    assert summary == "Total area across 3 shapes: 31"


def test_area_summary_empty():
    assert area_summary(rectangles=[], squares=[]) == "Total area across 0 shapes: 0"
