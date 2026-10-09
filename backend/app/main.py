from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.api.v1.router import api_router
from app.services.seed_service import seed_demo_data

# Create Database tables
Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event handler for application startup and shutdown."""
    db = SessionLocal()
    try:
        seed_demo_data(db)
    finally:
        db.close()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    description=f"Operational decision-support platform for public transport authorities. {settings.PROJECT_TAGLINE}",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health", tags=["System Health"])
def health_check():
    """Liveness health check endpoint."""
    return {
        "status": "HEALTHY",
        "platform": settings.PROJECT_NAME,
        "operating_mode": "DEMO DATA" if settings.DEMO_MODE else "PRODUCTION",
        "agency": settings.DEFAULT_AGENCY_NAME
    }

@app.get("/readiness", tags=["System Health"])
def readiness_check():
    """Readiness probe endpoint checking database connection."""
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        return {"status": "READY", "database": "CONNECTED"}
    except Exception as e:
        return {"status": "NOT_READY", "error": str(e)}

# Include API v1 router
app.include_router(api_router, prefix=settings.API_V1_STR)
