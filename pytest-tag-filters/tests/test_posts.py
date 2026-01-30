import pytest


class TestPost:
    
    @pytest.mark.execution_tag("component", "model")
    def test_post_title(self):
        assert True

    @pytest.mark.execution_tag("component", "model")
    def test_post_content(self):
        assert False

    @pytest.mark.execution_tag("component", "frontend")
    def test_search_post(self):
        assert True

