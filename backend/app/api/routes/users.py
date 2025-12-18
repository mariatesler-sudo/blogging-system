from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.user import UpdateMeIn, UserOut

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=list[UserOut])
async def list_users(
    query: str | None = None,
    limit: int = 20,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
) -> list[UserOut]:
    stmt = select(User).order_by(User.id).limit(limit).offset(offset)
    if query:
        stmt = select(User).where(User.username.ilike(f"%{query}%")).order_by(User.id).limit(limit).offset(offset)
    res = await db.execute(stmt)
    return list(res.scalars().all())


@router.get("/{user_id}", response_model=UserOut)
async def get_user(user_id: int, db: AsyncSession = Depends(get_db)) -> UserOut:
    res = await db.execute(select(User).where(User.id == user_id))
    user = res.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.patch("/me", response_model=UserOut)
async def update_me(
    data: UpdateMeIn,
    me: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserOut:
    if data.email is not None:
        me.email = data.email
    if data.username is not None:
        me.username = data.username
    if data.bio is not None:
        me.bio = data.bio

    await db.commit()
    await db.refresh(me)
    return me
