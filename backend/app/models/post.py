from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Post(Base):
    __tablename__ = "posts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(200))
    content: Mapped[str] = mapped_column(Text)

    author_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    author = relationship("User", back_populates="posts")

    comments = relationship("Comment", back_populates="post", cascade="all, delete-orphan")
    likes = relationship("Like", backref="post", cascade="all, delete-orphan")
    favorites = relationship("Favorite", backref="post", cascade="all, delete-orphan")

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())