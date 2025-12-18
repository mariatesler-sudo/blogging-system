import pytest
import sys
import os


sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from app.main import app


def test_register_and_login():

    client = TestClient(app)
    

    register_data = {
        "email": "user@example.com",
        "username": "testuser",
        "password": "password123"
    }
    
    response = client.post("/api/auth/register", json=register_data)
    print(f"Register response: {response.status_code}, {response.json()}")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "user_id" in data
    

    login_data = {
        "email": "user@example.com",
        "password": "password123"
    }
    
    response = client.post("/api/auth/login", json=login_data)
    print(f"Login response: {response.status_code}")
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_health_check():

    client = TestClient(app)
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_root_endpoint():

    client = TestClient(app)
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["message"] == "Blog Platform API"


@pytest.mark.asyncio
async def test_async_example():

    import asyncio
    result = await asyncio.sleep(0.01, result="test")
    assert result == "test"
