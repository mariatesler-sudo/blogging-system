from datetime import datetime
from pydantic import BaseModel, Field


class PostCreateIn(BaseModel):
    title: str = Field(min_length=3, max_length=150)
    content: str = Field(min_length=1)


class PostUpdateIn(BaseModel):
    title: str | None = Field(default=None, min_length=3, max_length=150)
    content: str | None = Field(default=None, min_length=1)


class PostOut(BaseModel):
    id: int
    author_id: int
    title: str
    content: str
    created_at: datetime
    updated_at: datetime
    likes_count: int
    liked_by_me: bool
    favorited_by_me: bool

    class Config:
        from_attributes = True
