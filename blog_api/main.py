from typing import List

from fastapi import FastAPI, HTTPException

from database import posts, users
from models import Post, User

app = FastAPI(title="Blog API", description="REST API для блога")


@app.get("/users", response_model=List[User])
async def get_users():
    return users


@app.get("/users/{user_id}", response_model=User)
async def get_user(user_id: int):
    for user in users:
        if user.id == user_id:
            return user
    raise HTTPException(status_code=404, detail="User not found")


@app.post("/users", response_model=User)
async def create_user(user: User):
    for u in users:
        if u.id == user.id:
            raise HTTPException(status_code=400, detail="User already exists")
    users.append(user)
    return user


@app.put("/users/{user_id}", response_model=User)
async def update_user(user_id: int, updated: User):
    for i, u in enumerate(users):
        if u.id == user_id:
            users[i] = updated
            return updated
    raise HTTPException(status_code=404, detail="User not found")


@app.delete("/users/{user_id}")
async def delete_user(user_id: int):
    for u in users:
        if u.id == user_id:
            users.remove(u)
            return {"message": "User deleted"}
    raise HTTPException(status_code=404, detail="User not found")


@app.get("/posts", response_model=List[Post])
async def get_posts():
    return posts


@app.get("/posts/{post_id}", response_model=Post)
async def get_post(post_id: int):
    for post in posts:
        if post.id == post_id:
            return post
    raise HTTPException(status_code=404, detail="Post not found")


@app.post("/posts", response_model=Post)
async def create_post(post: Post):
    for p in posts:
        if p.id == post.id:
            raise HTTPException(status_code=400, detail="Post already exists")
    posts.append(post)
    return post


@app.put("/posts/{post_id}", response_model=Post)
async def update_post(post_id: int, updated: Post):
    for i, p in enumerate(posts):
        if p.id == post_id:
            posts[i] = updated
            return updated
    raise HTTPException(status_code=404, detail="Post not found")


@app.delete("/posts/{post_id}")
async def delete_post(post_id: int):
    for p in posts:
        if p.id == post_id:
            posts.remove(p)
            return {"message": "Post deleted"}
    raise HTTPException(status_code=404, detail="Post not found")
