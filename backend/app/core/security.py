from datetime import datetime, timedelta
from typing import Any
from jose import jwt
import hashlib

from app.core.config import settings


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def verify_password(password: str, password_hash: str) -> bool:
    test_hash = hashlib.sha256(password.encode()).hexdigest()
    return test_hash == password_hash


def create_access_token(subject: str, expires_minutes: int | None = None, **extra: Any) -> str:
    expire = datetime.utcnow() + timedelta(minutes=expires_minutes or settings.access_token_exp_minutes)


    subject_str = str(subject)

    to_encode = {"sub": subject_str, "exp": expire, **extra}
    print(f"Creating token for subject: {subject_str} (type: {type(subject_str)})")
    print(f"Using secret: {settings.jwt_secret[:10]}...")

    token = jwt.encode(to_encode, settings.jwt_secret, algorithm=settings.jwt_algorithm)
    print(f"Token created: {token[:50]}...")
    return token