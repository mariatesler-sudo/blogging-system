from pydantic_settings import BaseSettings, SettingsConfigDict
import os


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    app_name: str = "Blog Platform API"
    api_prefix: str = "/api"


    database_url: str = os.environ.get(
        "DATABASE_URL",
        "sqlite+aiosqlite:///./test.db"
    )


    jwt_secret: str = "test-secret-key-12345-change-in-production"
    jwt_algorithm: str = "HS256"
    access_token_exp_minutes: int = 60 * 24

    redis_url: str = "redis://localhost:6379/0"


settings = Settings()