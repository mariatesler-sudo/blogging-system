

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from fastapi.testclient import TestClient
from app.main import app


def test_health_check_no_db():

    client = TestClient(app)
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_root_endpoint_no_db():

    client = TestClient(app)
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["message"] == "Blog Platform API"


def test_docs_endpoints():

    client = TestClient(app)
    

    response = client.get("/docs")
    assert response.status_code == 200
    

    response = client.get("/openapi.json")
    assert response.status_code == 200
    openapi_schema = response.json()
    assert "openapi" in openapi_schema
    assert "paths" in openapi_schema
