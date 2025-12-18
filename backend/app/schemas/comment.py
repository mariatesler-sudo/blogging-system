from datetime import datetime
from pydantic import BaseModel, Field


class CommentCreateIn(BaseModel):
    text: str = Field(min_length=1, max_length=2000)


class CommentOut(BaseModel):
    id: int
    user_id: int
    post_id: int
    text: str
    created_at: datetime

    class Config:
        from_attributes = True
