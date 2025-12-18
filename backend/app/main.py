from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes import auth, posts, users

app = FastAPI(title=settings.app_name)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5500",
        "http://127.0.0.1:5500",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def on_startup():

    from app.db.base import Base
    from app.db.session import engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


app.include_router(auth.router, prefix=settings.api_prefix)
app.include_router(users.router, prefix=settings.api_prefix)
app.include_router(posts.router, prefix=settings.api_prefix)

@app.get("/")
async def root():
    return {"message": "Blog Platform API"}

@app.get("/health")
async def health():
    return {"status": "ok"}