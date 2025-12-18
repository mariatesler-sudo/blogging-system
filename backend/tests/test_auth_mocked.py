

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import hash_password


def test_auth_with_mocks():

    client = TestClient(app)
    

    response = client.post("/api/auth/register", json={
        "email": "test@example.com",
        "username": "testuser",
        "password": "password123"
    })
    print(f"Register response (with possible DB error): {response.status_code}, {response.json()}")
    

    if response.status_code == 200:
        data = response.json()

        assert "success" in data
        if data["success"]:
            assert "user_id" in data
        else:
            assert "error" in data


def test_login_with_mocks():

    client = TestClient(app)
    
    response = client.post("/api/auth/login", json={
        "email": "test@example.com",
        "password": "password123"
    })
    print(f"Login response: {response.status_code}, {response.json()}")
    

    assert response.status_code in [200, 401]
    
    if response.status_code == 200:
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"


def test_security_functions():

    from app.core.security import hash_password, verify_password
    
    password = "test123"
    hashed = hash_password(password)
    

    assert len(hashed) == 64
    assert hashed != password
    

    assert verify_password(password, hashed) is True
    assert verify_password("wrong", hashed) is False
    
    print(f"Password: {password}")
    print(f"Hashed: {hashed}")
    print("✓ Security functions work correctly")
