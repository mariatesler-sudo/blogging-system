import pytest
from httpx import AsyncClient


class TestPosts:


    async def test_create_post_success(self, client: AsyncClient, auth_headers):

        response = await client.post(
            "/api/posts",
            json={
                "title": "Test Post Title",
                "content": "Test post content"
            },
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Test Post Title"
        assert data["content"] == "Test post content"
        assert data["likes_count"] == 0
        assert data["comments_count"] == 0
        assert data["is_liked"] is False
        assert data["is_favorite"] is False

    async def test_create_post_unauthorized(self, client: AsyncClient):

        response = await client.post(
            "/api/posts",
            json={
                "title": "Test Post",
                "content": "Content"
            }
        )
        assert response.status_code == 401

    async def test_get_posts_list(self, client: AsyncClient, auth_headers):

        for i in range(3):
            await client.post(
                "/api/posts",
                json={
                    "title": f"Post {i}",
                    "content": f"Content {i}"
                },
                headers=auth_headers
            )


        response = await client.get(
            "/api/posts",
            headers=auth_headers
        )
        assert response.status_code == 200
        posts = response.json()
        assert isinstance(posts, list)
        assert len(posts) >= 3

    async def test_get_single_post(self, client: AsyncClient, auth_headers):


        create_response = await client.post(
            "/api/posts",
            json={
                "title": "Test Post",
                "content": "Test Content"
            },
            headers=auth_headers
        )
        post_id = create_response.json()["id"]


        response = await client.get(f"/api/posts/{post_id}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == post_id
        assert data["title"] == "Test Post"

    async def test_get_nonexistent_post(self, client: AsyncClient, auth_headers):

        response = await client.get("/api/posts/999999", headers=auth_headers)
        assert response.status_code == 404
        assert "Post not found" in response.json()["detail"]

    async def test_update_post_as_author(self, client: AsyncClient, auth_headers):


        create_response = await client.post(
            "/api/posts",
            json={
                "title": "Original Title",
                "content": "Original Content"
            },
            headers=auth_headers
        )
        post_id = create_response.json()["id"]


        update_response = await client.patch(
            f"/api/posts/{post_id}",
            json={
                "title": "Updated Title",
                "content": "Updated Content"
            },
            headers=auth_headers
        )
        assert update_response.status_code == 200
        data = update_response.json()
        assert data["title"] == "Updated Title"
        assert data["content"] == "Updated Content"

    async def test_delete_post_as_author(self, client: AsyncClient, auth_headers):


        create_response = await client.post(
            "/api/posts",
            json={
                "title": "To Delete",
                "content": "Content"
            },
            headers=auth_headers
        )
        post_id = create_response.json()["id"]


        delete_response = await client.delete(
            f"/api/posts/{post_id}",
            headers=auth_headers
        )
        assert delete_response.status_code == 200
        assert delete_response.json()["success"] is True


        get_response = await client.get(f"/api/posts/{post_id}", headers=auth_headers)
        assert get_response.status_code == 404


class TestPostLikes:


    async def test_like_post(self, client: AsyncClient, auth_headers):

        create_response = await client.post(
            "/api/posts",
            json={
                "title": "Post to Like",
                "content": "Content"
            },
            headers=auth_headers
        )
        post_id = create_response.json()["id"]


        like_response = await client.post(
            f"/api/posts/{post_id}/like",
            headers=auth_headers
        )
        assert like_response.status_code == 200
        assert like_response.json()["success"] is True


        get_response = await client.get(f"/api/posts/{post_id}", headers=auth_headers)
        data = get_response.json()
        assert data["likes_count"] == 1
        assert data["is_liked"] is True

    async def test_unlike_post(self, client: AsyncClient, auth_headers):

        create_response = await client.post(
            "/api/posts",
            json={
                "title": "Post to Unlike",
                "content": "Content"
            },
            headers=auth_headers
        )
        post_id = create_response.json()["id"]
        await client.post(f"/api/posts/{post_id}/like", headers=auth_headers)


        unlike_response = await client.delete(
            f"/api/posts/{post_id}/like",
            headers=auth_headers
        )
        assert unlike_response.status_code == 200
        assert unlike_response.json()["success"] is True


        get_response = await client.get(f"/api/posts/{post_id}", headers=auth_headers)
        data = get_response.json()
        assert data["likes_count"] == 0
        assert data["is_liked"] is False


class TestPostComments:


    async def test_create_comment(self, client: AsyncClient, auth_headers):

        create_response = await client.post(
            "/api/posts",
            json={
                "title": "Post for Comment",
                "content": "Content"
            },
            headers=auth_headers
        )
        post_id = create_response.json()["id"]


        comment_response = await client.post(
            f"/api/posts/{post_id}/comments",
            json={"text": "Test comment"},
            headers=auth_headers
        )
        assert comment_response.status_code == 200
        data = comment_response.json()
        assert data["text"] == "Test comment"
        assert "user_username" in data

    async def test_get_comments(self, client: AsyncClient, auth_headers):

        create_response = await client.post(
            "/api/posts",
            json={
                "title": "Post for Comments",
                "content": "Content"
            },
            headers=auth_headers
        )
        post_id = create_response.json()["id"]


        for i in range(2):
            await client.post(
                f"/api/posts/{post_id}/comments",
                json={"text": f"Comment {i}"},
                headers=auth_headers
            )


        response = await client.get(f"/api/posts/{post_id}/comments", headers=auth_headers)
        assert response.status_code == 200
        comments = response.json()
        assert len(comments) == 2
        assert comments[0]["text"] == "Comment 0"
        assert comments[1]["text"] == "Comment 1"