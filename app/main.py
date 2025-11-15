"""
FastAPI application entry point for Game Analytics platform.
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.sessions import router as sessions_router
from app.api.events import router as events_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
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
    
    yield
    
    # Shutdown
    logger.info("⏹️  Shutting down Game Analytics API server...")
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
app.include_router(sessions_router)
app.include_router(events_router)


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
