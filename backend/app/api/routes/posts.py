from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime

from app.api.deps import get_current_user, get_db
from app.models.post import Post
from app.models.user import User
from app.models.like import Like
from app.models.comment import Comment
from app.models.favorite import Favorite

router = APIRouter(prefix="/posts", tags=["posts"])



class PostCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    content: str = Field(min_length=1)


class PostUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    content: Optional[str] = Field(None, min_length=1)


class PostOut(BaseModel):
    id: int
    title: str
    content: str
    author_id: int
    author_username: str
    created_at: datetime
    likes_count: int = 0
    comments_count: int = 0
    is_liked: bool = False
    is_favorite: bool = False

    class Config:
        from_attributes = True


class CommentCreate(BaseModel):
    text: str = Field(min_length=1, max_length=1000)


class CommentOut(BaseModel):
    id: int
    text: str
    user_id: int
    user_username: str
    created_at: datetime

    class Config:
        from_attributes = True



@router.post("", response_model=PostOut)
async def create_post(
        data: PostCreate,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
) -> PostOut:

    post = Post(
        title=data.title,
        content=data.content,
        author_id=current_user.id,
    )
    db.add(post)
    await db.commit()
    await db.refresh(post)


    return await _enrich_post(post, current_user.id, db)


@router.get("", response_model=list[PostOut])
async def list_posts(
        query: Optional[str] = None,
        author_id: Optional[int] = None,
        limit: int = Query(20, ge=1, le=100),
        offset: int = Query(0, ge=0),
        current_user: Optional[User] = Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
) -> list[PostOut]:

    stmt = select(Post).order_by(Post.created_at.desc())

    if query:
        stmt = stmt.where(
            (Post.title.ilike(f"%{query}%")) |
            (Post.content.ilike(f"%{query}%"))
        )

    stmt = stmt.limit(limit).offset(offset)
    res = await db.execute(stmt)
    posts = list(res.scalars().all())

    user_id = current_user.id if current_user else None
    return [await _enrich_post(post, user_id, db) for post in posts]


@router.get("/{post_id}", response_model=PostOut)
async def get_post(
        post_id: int,
        current_user: Optional[User] = Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
) -> PostOut:

    res = await db.execute(select(Post).where(Post.id == post_id))
    post = res.scalar_one_or_none()
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")

    user_id = current_user.id if current_user else None
    return await _enrich_post(post, user_id, db)


@router.patch("/{post_id}", response_model=PostOut)
async def update_post(
        post_id: int,
        data: PostUpdate,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
) -> PostOut:

    res = await db.execute(select(Post).where(Post.id == post_id))
    post = res.scalar_one_or_none()

    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    if post.author_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")

    if data.title is not None:
        post.title = data.title
    if data.content is not None:
        post.content = data.content

    await db.commit()
    await db.refresh(post)
    return await _enrich_post(post, current_user.id, db)


@router.delete("/{post_id}")
async def delete_post(
        post_id: int,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
):

    res = await db.execute(select(Post).where(Post.id == post_id))
    post = res.scalar_one_or_none()

    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    if post.author_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")

    await db.delete(post)
    await db.commit()
    return {"success": True}



@router.post("/{post_id}/like")
async def like_post(
        post_id: int,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
):

    res = await db.execute(select(Post).where(Post.id == post_id))
    if res.scalar_one_or_none() is None:
        raise HTTPException(status_code=404, detail="Post not found")


    res = await db.execute(
        select(Like).where(
            (Like.post_id == post_id) &
            (Like.user_id == current_user.id)
        )
    )
    existing = res.scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Already liked")

    like = Like(post_id=post_id, user_id=current_user.id)
    db.add(like)
    await db.commit()
    return {"success": True}


@router.delete("/{post_id}/like")
async def unlike_post(
        post_id: int,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
):

    res = await db.execute(
        select(Like).where(
            (Like.post_id == post_id) &
            (Like.user_id == current_user.id)
        )
    )
    like = res.scalar_one_or_none()
    if like is None:
        raise HTTPException(status_code=400, detail="Not liked yet")

    await db.delete(like)
    await db.commit()
    return {"success": True}



@router.post("/{post_id}/comments", response_model=CommentOut)
async def create_comment(
        post_id: int,
        data: CommentCreate,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
) -> CommentOut:


    res = await db.execute(select(Post).where(Post.id == post_id))
    if res.scalar_one_or_none() is None:
        raise HTTPException(status_code=404, detail="Post not found")

    comment = Comment(
        post_id=post_id,
        user_id=current_user.id,
        text=data.text,
    )
    db.add(comment)
    await db.commit()
    await db.refresh(comment)


    res = await db.execute(select(User).where(User.id == current_user.id))
    user = res.scalar_one()

    return CommentOut(
        id=comment.id,
        text=comment.text,
        user_id=comment.user_id,
        user_username=user.username,
        created_at=comment.created_at,
    )


@router.get("/{post_id}/comments", response_model=list[CommentOut])
async def get_comments(
        post_id: int,
        db: AsyncSession = Depends(get_db),
) -> list[CommentOut]:

    res = await db.execute(
        select(Comment, User.username)
        .join(User, Comment.user_id == User.id)
        .where(Comment.post_id == post_id)
        .order_by(Comment.created_at)
    )

    comments = []
    for comment, username in res.all():
        comments.append(CommentOut(
            id=comment.id,
            text=comment.text,
            user_id=comment.user_id,
            user_username=username,
            created_at=comment.created_at,
        ))

    return comments



@router.post("/{post_id}/favorite")
async def add_to_favorites(
        post_id: int,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
):

    res = await db.execute(select(Post).where(Post.id == post_id))
    if res.scalar_one_or_none() is None:
        raise HTTPException(status_code=404, detail="Post not found")


    res = await db.execute(
        select(Favorite).where(
            (Favorite.post_id == post_id) &
            (Favorite.user_id == current_user.id)
        )
    )
    existing = res.scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Already in favorites")

    favorite = Favorite(post_id=post_id, user_id=current_user.id)
    db.add(favorite)
    await db.commit()
    return {"success": True}


@router.delete("/{post_id}/favorite")
async def remove_from_favorites(
        post_id: int,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
):

    res = await db.execute(
        select(Favorite).where(
            (Favorite.post_id == post_id) &
            (Favorite.user_id == current_user.id)
        )
    )
    favorite = res.scalar_one_or_none()
    if favorite is None:
        raise HTTPException(status_code=400, detail="Not in favorites")

    await db.delete(favorite)
    await db.commit()
    return {"success": True}


@router.get("/me/favorites", response_model=list[PostOut])
async def get_favorites(
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
) -> list[PostOut]:

    res = await db.execute(
        select(Post)
        .join(Favorite, Post.id == Favorite.post_id)
        .where(Favorite.user_id == current_user.id)
        .order_by(Favorite.id.desc())
    )
    posts = list(res.scalars().all())
    return [await _enrich_post(post, current_user.id, db) for post in posts]



async def _enrich_post(post: Post, user_id: Optional[int], db: AsyncSession) -> PostOut:

    res = await db.execute(select(User).where(User.id == post.author_id))
    author = res.scalar_one()


    res = await db.execute(
        select(func.count(Like.id)).where(Like.post_id == post.id)
    )
    likes_count = res.scalar() or 0


    res = await db.execute(
        select(func.count(Comment.id)).where(Comment.post_id == post.id)
    )
    comments_count = res.scalar() or 0


    is_liked = False
    if user_id:
        res = await db.execute(
            select(Like).where(
                (Like.post_id == post.id) &
                (Like.user_id == user_id)
            )
        )
        is_liked = res.scalar_one_or_none() is not None


    is_favorite = False
    if user_id:
        res = await db.execute(
            select(Favorite).where(
                (Favorite.post_id == post.id) &
                (Favorite.user_id == user_id)
            )
        )
        is_favorite = res.scalar_one_or_none() is not None

    return PostOut(
        id=post.id,
        title=post.title,
        content=post.content,
        author_id=post.author_id,
        author_username=author.username,
        created_at=post.created_at,
        likes_count=likes_count,
        comments_count=comments_count,
        is_liked=is_liked,
        is_favorite=is_favorite,
    )