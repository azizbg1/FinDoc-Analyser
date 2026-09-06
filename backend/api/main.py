"""FastAPI application entry point."""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.config import APP_NAME, CORS_ORIGINS
from backend.database.connection import engine, Base
from backend.api.routes import upload, analyze, results, chat
from backend.utils.logger import get_logger

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create all DB tables on startup."""
    logger.info("Creating database tables if they do not exist…")
    Base.metadata.create_all(bind=engine)
    logger.info("Database ready.")
    yield
    logger.info("Application shutting down.")


app = FastAPI(
    title=APP_NAME,
    description=(
        "API multi-agents pour la détection d'anomalies dans les documents financiers. "
        "Basée sur LangGraph, Llama 3, PaddleOCR, spaCy et ChromaDB."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routes ────────────────────────────────────────────────────────────────────
app.include_router(upload.router, prefix="/api", tags=["upload"])
app.include_router(analyze.router, prefix="/api", tags=["analyze"])
app.include_router(results.router, prefix="/api", tags=["results"])
app.include_router(chat.router, prefix="/api", tags=["chat"])


@app.get("/", tags=["health"])
def root():
    return {"status": "ok", "service": APP_NAME}


@app.get("/health", tags=["health"])
def health():
    return {"status": "healthy"}
