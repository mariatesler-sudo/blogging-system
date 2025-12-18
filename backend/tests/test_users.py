import pytest
from httpx import AsyncClient


class TestUsers:


    async def test_get_users_list(self, client: AsyncClient, auth_headers):

        response = await client.get("/api/users", headers=auth_headers)
        assert response.status_code == 200
        users = response.json()
        assert isinstance(users, list)

    async def test_search_users(self, client: AsyncClient, auth_headers, test_user):

        response = await client.get(
            f"/api/users?query={test_user.username}",
            headers=auth_headers
        )
        assert response.status_code == 200
        users = response.json()
        assert len(users) > 0
        assert users[0]["username"] == test_user.username

    async def test_get_user_profile(self, client: AsyncClient, auth_headers, test_user):

        response = await client.get(f"/api/users/{test_user.id}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_user.id
        assert data["email"] == test_user.email
        assert data["username"] == test_user.username

    async def test_get_nonexistent_user(self, client: AsyncClient, auth_headers):

        response = await client.get("/api/users/999999", headers=auth_headers)
        assert response.status_code == 404
        assert "User not found" in response.json()["detail"]

    async def test_update_own_profile(self, client: AsyncClient, auth_headers):

        update_data = {
            "username": "updatedusername",
            "bio": "Updated bio text"
        }
        response = await client.patch(
            "/api/users/me",
            json=update_data,
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == "updatedusername"
        assert data["bio"] == "Updated bio text"