"""
FastAPI application entry point for Game Analytics platform.
"""

import logging
from contextlib import asynccontextmanager
from app.logging_config import setup_structured_logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.sessions import router as sessions_router
from app.api.events import router as events_router
from app.api.leaderboard import router as leaderboard_router
from app.api.analytics import router as analytics_router
from app.api.heatmap_api import router as heatmap_router
from app.api.admin import router as admin_router

from app.jobs import create_scheduler

from app.routes.auth import router as auth_router
from app.routes.scores import router as scores_router

from app.metrics import router as metrics_router
from app.api.exports import router as exports_router


# Configure structured logging
setup_structured_logging()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan event handler for startup and shutdown events.
    """
    # Startup
    logger.info("🚀 Starting Game Analytics API server...")
    logger.info("Service: game-analytics")
    logger.info("Environment: development")
    scheduler = create_scheduler()
    scheduler.start()
    app.state.scheduler = scheduler
    
    yield
    
    # Shutdown
    logger.info("⏹️  Shutting down Game Analytics API server...")
    try:
        scheduler = getattr(app.state, "scheduler", None)
        if scheduler:
            scheduler.shutdown(wait=False)
    except Exception:
        pass
    logger.info("Cleanup completed successfully")


# Initialize FastAPI application
app = FastAPI(
    title="Game Analytics API",
    description="Real-time game analytics platform for tracking player behavior and game metrics",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # React dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers


app.include_router(metrics_router)
app.include_router(exports_router)
app.include_router(auth_router, prefix="/api/v1")
app.include_router(scores_router, prefix="/api/v1")
app.include_router(sessions_router)
app.include_router(events_router)
app.include_router(leaderboard_router)
app.include_router(analytics_router)
app.include_router(heatmap_router)
app.include_router(admin_router)


@app.get("/")
async def root():
    """
    Root endpoint to verify API is running.
    
    Returns:
        dict: Status and service information
    """
    return {
        "status": "ok",
        "service": "game-analytics"
    }


@app.get("/health")
async def health_check():
    """
    Health check endpoint for monitoring and load balancers.
    
    Returns:
        dict: Health status information
    """
    return {
        "status": "healthy",
        "service": "game-analytics",
        "version": "1.0.0"
    }


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
