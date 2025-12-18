from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class UserOut(BaseModel):
    id: int
    username: str
    email: str  # <-- Заменить str на str
    bio: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class UpdateMeIn(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None  # <-- Заменить str на str
    bio: Optional[str] = None