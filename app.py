"""
Main FastAPI Application
File: app.py

Integrates all API modules including:
- Authentication (auth.py)
- Employee Management (employee_management.py)
- Patient Management (patient_management.py)
- Vendor Clinical Trials (vendor_clinical_api.py)
- Dashboard Metrics (dbRetrievalWithNewMetrics.py)
"""

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import logging

# Import configuration
from config import (
    APP_NAME,
    APP_VERSION,
    APP_DESCRIPTION,
    CORS_ORIGINS,
    PORT,
    HOST
)

# Import database
from database import get_db

# Import existing modules
from auth import router as auth_router
from employee_management import router as employee_router
from patient_management import router as patient_router

# Import new vendor clinical trial module
from vendor_clinical_api import router as clinical_router

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ==================== FastAPI App Initialization ====================

app = FastAPI(
    title=APP_NAME,
    version=APP_VERSION,
    description=APP_DESCRIPTION,
    docs_url="/docs",
    redoc_url="/redoc"
)

# ==================== CORS Middleware ====================

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== Include Routers ====================

# Authentication endpoints (login, register, etc.)
app.include_router(auth_router)

# Employee management endpoints
app.include_router(employee_router)

# Patient management endpoints
app.include_router(patient_router)

# Vendor clinical trial endpoints (NEW)
app.include_router(clinical_router)

# ==================== Root Health Check ====================

@app.get("/")
async def root():
    """Root endpoint - API health check"""
    return {
        "status": "healthy",
        "message": "MannBiome API is running",
        "version": APP_VERSION,
        "documentation": "/docs"
    }


@app.get("/health")
async def health_check():
    """Detailed health check endpoint"""
    return {
        "status": "healthy",
        "service": APP_NAME,
        "version": APP_VERSION,
        "endpoints": {
            "authentication": "/token, /register",
            "employees": "/api/vendor/employees",
            "patients": "/api/vendor/patients",
            "clinical_trials": "/api/vendor/clinical",
            "documentation": "/docs"
        }
    }


# ==================== Database Check Endpoint ====================

@app.get("/db-status")
async def database_status(db: Session = Depends(get_db)):
    """Check database connectivity"""
    try:
        # Simple query to test connection
        from sqlalchemy import text
        result = db.execute(text("SELECT 1")).fetchone()
        return {
            "status": "connected",
            "message": "Database connection successful"
        }
    except Exception as e:
        logger.error(f"Database connection error: {str(e)}")
        return {
            "status": "error",
            "message": f"Database connection failed: {str(e)}"
        }


# ==================== Startup/Shutdown Events ====================

@app.on_event("startup")
async def startup_event():
    """Execute on application startup"""
    logger.info("=" * 80)
    logger.info(f"🚀 Starting {APP_NAME} v{APP_VERSION}")
    logger.info(f"📍 Running on: http://{HOST}:{PORT}")
    logger.info(f"📚 API Documentation: http://{HOST}:{PORT}/docs")
    logger.info("=" * 80)
    logger.info("✅ Available API modules:")
    logger.info("   - Authentication & User Management")
    logger.info("   - Employee Management")
    logger.info("   - Patient Management")
    logger.info("   - Vendor Clinical Trials (NEW)")
    logger.info("=" * 80)


@app.on_event("shutdown")
async def shutdown_event():
    """Execute on application shutdown"""
    logger.info("=" * 80)
    logger.info(f"🛑 Shutting down {APP_NAME}")
    logger.info("=" * 80)


# ==================== Error Handlers ====================

@app.exception_handler(404)
async def not_found_handler(request, exc):
    """Custom 404 handler"""
    return {
        "error": "Not Found",
        "message": f"The endpoint {request.url.path} does not exist",
        "documentation": "/docs"
    }


@app.exception_handler(500)
async def internal_error_handler(request, exc):
    """Custom 500 handler"""
    logger.error(f"Internal server error: {str(exc)}")
    return {
        "error": "Internal Server Error",
        "message": "An unexpected error occurred. Please try again later."
    }


# ==================== Run Application ====================

if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app:app",
        host=HOST,
        port=PORT,
        reload=True,  # Auto-reload on code changes (development only)
        log_level="info"
    )