from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import traceback
import hashlib

from app.api.deps import get_db
from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["auth"])



class RegisterIn(BaseModel):
    email: str = Field(min_length=5)
    username: str = Field(min_length=3)
    password: str = Field(min_length=6)


class LoginIn(BaseModel):
    email: str = Field(min_length=5)
    password: str = Field(min_length=6)


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


@router.post("/register")
async def register(data: RegisterIn, db: AsyncSession = Depends(get_db)):
    try:
        print("=== REGISTER START ===")
        print(f"Data: email={data.email}, username={data.username}")


        print("1. Checking email uniqueness...")
        result = await db.execute(select(User).where(User.email == data.email))
        existing_email = result.scalar_one_or_none()
        if existing_email:
            print(f"Email {data.email} already exists")
            return {"success": False, "error": "Email already registered"}


        print("2. Checking username uniqueness...")
        result = await db.execute(select(User).where(User.username == data.username))
        existing_username = result.scalar_one_or_none()
        if existing_username:
            print(f"Username {data.username} already taken")
            return {"success": False, "error": "Username already taken"}


        print("3. Creating user object...")
        user = User(
            email=data.email,
            username=data.username,
            password_hash=hash_password(data.password),
            role="user",
        )
        print(f"User object created: {user.email}, {user.username}")


        print("4. Adding to database...")
        db.add(user)
        await db.commit()
        await db.refresh(user)

        print(f"5. User created successfully! ID: {user.id}")
        return {"success": True, "user_id": user.id}

    except Exception as e:
        print(f"!!! ERROR: {type(e).__name__}")
        print(f"Error message: {str(e)}")
        print("Full traceback:")
        traceback.print_exc()
        return {"success": False, "error": str(e)}


@router.post("/login", response_model=TokenOut)
async def login(data: LoginIn, db: AsyncSession = Depends(get_db)):
    try:
        print("=== LOGIN START ===")
        print(f"Email: {data.email}")


        result = await db.execute(select(User).where(User.email == data.email))
        user = result.scalar_one_or_none()

        if not user:
            print("User not found")
            raise HTTPException(status_code=401, detail="Invalid email or password")

        print(f"User found: id={user.id}, username={user.username}")


        if not verify_password(data.password, user.password_hash):
            print("Password verification failed")
            raise HTTPException(status_code=401, detail="Invalid email or password")


        token = create_access_token(user.id)
        print(f"Login successful! Token created for user {user.id}")

        return {"access_token": token, "token_type": "bearer"}

    except HTTPException:
        raise
    except Exception as e:
        print(f"!!! ERROR: {type(e).__name__}")
        print(f"Error message: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")