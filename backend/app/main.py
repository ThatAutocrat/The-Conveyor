from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.routers import auth, repos, pipelines, webhooks, ws
from app.core.database import create_tables
from app.core.config import settings

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_tables()
    yield

app = FastAPI(title="CI/CD Status Board", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://the-conveyor.vercel.app",
        *settings.ALLOWED_ORIGINS,
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(repos.router, prefix="/api/repos", tags=["repos"])
app.include_router(pipelines.router, prefix="/api/pipelines", tags=["pipelines"])
app.include_router(webhooks.router, prefix="/webhooks", tags=["webhooks"])
app.include_router(ws.router, prefix="/ws", tags=["websocket"])

@app.get("/health")
def health():
    return {"status": "ok"}
