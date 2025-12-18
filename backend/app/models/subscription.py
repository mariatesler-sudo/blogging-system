from sqlalchemy import CheckConstraint, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Subscription(Base):
    __tablename__ = "subscriptions"
    __table_args__ = (
        UniqueConstraint("follower_id", "following_id", name="uq_sub"),
        CheckConstraint("follower_id <> following_id", name="chk_not_self_follow"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    follower_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    following_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
