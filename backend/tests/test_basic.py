import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert "message" in response.json()

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_security():
    from app.core.security import hash_password, verify_password
    hashed = hash_password("test")
    assert verify_password("test", hashed)
    assert not verify_password("wrong", hashed)

def test_config():
    from app.core.config import settings
    assert settings.app_name == "Blog Platform API"
    assert settings.api_prefix == "/api"

def test_models():
    from app.models.user import User
    from app.models.post import Post
    user = User(email="test@test.com", username="test", password_hash="hash")
    post = Post(title="Test", content="Content", author_id=1)
    assert user.email == "test@test.com"
    assert post.title == "Test"
