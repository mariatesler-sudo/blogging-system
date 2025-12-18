from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class User(BaseModel):
    id: int
    email: EmailStr
    username: str
    password: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Post(BaseModel):
    id: int
    user_id: int
    title: str
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
