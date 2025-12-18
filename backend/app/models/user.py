from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True)

    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(20), default="user")

    bio: Mapped[str | None] = mapped_column(Text, default=None)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    posts = relationship("Post", back_populates="author", cascade="all, delete-orphan")
    comments = relationship("Comment", backref="user", cascade="all, delete-orphan")
    likes = relationship("Like", backref="user", cascade="all, delete-orphan")
    favorites = relationship("Favorite", backref="user", cascade="all, delete-orphan")