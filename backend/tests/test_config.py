import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings
import pytest


def test_config():

    assert settings.app_name == "Blog Platform API"
    assert settings.api_prefix == "/api"
    assert settings.jwt_algorithm == "HS256"
    assert settings.access_token_exp_minutes == 60 * 24
    print(f"Database URL: {settings.database_url}")


def test_environment():

    os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///:memory:"
    from app.core.config import Settings
    test_settings = Settings()
    assert test_settings.database_url == "sqlite+aiosqlite:///:memory:"
