import pytest


class TestUser:
    
    @pytest.mark.execution_tag("component", "model")
    def test_user_email(self):
        assert True

    @pytest.mark.execution_tag("component", "model")
    def test_user_name(self):
        assert False

    @pytest.mark.execution_tag("component", "frontend")
    def test_user_login(self):
        assert True

    @pytest.mark.execution_tag("component", "frontend")
    def test_user_profile(self):
        assert True
    

