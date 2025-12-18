import pytest
from fastapi import HTTPException
from jose import jwt

from app.api.deps import get_current_user
from app.core.config import settings


class TestDependencies:
    """Тесты для зависимостей"""

    async def test_get_current_user_valid_token(self, db_session, test_user):
        """Получение пользователя по валидному токену"""
        # Создаем токен
        from app.core.security import create_access_token
        token = create_access_token(str(test_user.id))

        # Получаем пользователя
        user = await get_current_user(token=token, db=db_session)
        assert user is not None
        assert user.id == test_user.id
        assert user.email == test_user.email

    async def test_get_current_user_invalid_token(self, db_session):
        """Получение пользователя по невалидному токену"""
        with pytest.raises(HTTPException) as exc:
            await get_current_user(token="invalid_token", db=db_session)
        assert exc.value.status_code == 401

    async def test_get_current_user_expired_token(self, db_session, test_user):
        """Получение пользователя по истекшему токену"""
        import datetime
        # Создаем токен с истекшим сроком
        expire = datetime.datetime.utcnow() - datetime.timedelta(minutes=1)
        to_encode = {"sub": str(test_user.id), "exp": expire}
        token = jwt.encode(to_encode, settings.jwt_secret, algorithm=settings.jwt_algorithm)

        with pytest.raises(HTTPException) as exc:
            await get_current_user(token=token, db=db_session)
        assert exc.value.status_code == 401

    async def test_get_current_user_nonexistent_user(self, db_session):

        from app.core.security import create_access_token
        token = create_access_token("999999")

        with pytest.raises(HTTPException) as exc:
            await get_current_user(token=token, db=db_session)
        assert exc.value.status_code == 401

    async def test_get_current_user_no_token(self, db_session):

        user = await get_current_user(token=None, db=db_session)
        assert user is None