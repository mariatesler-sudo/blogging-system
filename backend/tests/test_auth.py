import pytest
from httpx import AsyncClient


class TestAuth:


    async def test_register_success(self, client: AsyncClient, db_session):

        response = await client.post(
            "/api/auth/register",
            json={
                "email": "newuser@example.com",
                "username": "newuser",
                "password": "password123"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "user_id" in data

    async def test_register_duplicate_email(self, client: AsyncClient, test_user):

        response = await client.post(
            "/api/auth/register",
            json={
                "email": test_user.email,
                "username": "differentuser",
                "password": "password123"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is False
        assert "Email already registered" in data["error"]

    async def test_register_duplicate_username(self, client: AsyncClient, test_user):

        response = await client.post(
            "/api/auth/register",
            json={
                "email": "different@example.com",
                "username": test_user.username,
                "password": "password123"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is False
        assert "Username already taken" in data["error"]

    async def test_register_invalid_data(self, client: AsyncClient):

        response = await client.post(
            "/api/auth/register",
            json={
                "email": "a@b",
                "username": "user",
                "password": "123"
            }
        )
        assert response.status_code == 422

    async def test_login_success(self, client: AsyncClient, test_user):

        response = await client.post(
            "/api/auth/login",
            json={
                "email": test_user.email,
                "password": "password123"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    async def test_login_wrong_password(self, client: AsyncClient, test_user):

        response = await client.post(
            "/api/auth/login",
            json={
                "email": test_user.email,
                "password": "wrongpassword"
            }
        )
        assert response.status_code == 401
        assert "Invalid email or password" in response.json()["detail"]

    async def test_login_nonexistent_user(self, client: AsyncClient):

        response = await client.post(
            "/api/auth/login",
            json={
                "email": "nonexistent@example.com",
                "password": "password123"
            }
        )
        assert response.status_code == 401
        assert "Invalid email or password" in response.json()["detail"]