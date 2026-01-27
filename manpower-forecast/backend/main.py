"""FastAPI main application."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from database import init_db, SessionLocal
from api import projects, schedules, crew_types, forecasts, auth
from api import export_pdf, subcontractor_reports
import models
import logger

# Create FastAPI app
app = FastAPI(
    title="SprinkSync Manpower Forecast API",
    description="Manpower forecasting and project scheduling for fire sprinkler contractors",
    version="1.0.0",
    redirect_slashes=False
)

# Configure CORS - uses settings from .env
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

# Include routers


app.include_router(projects.router)
app.include_router(schedules.router)
app.include_router(crew_types.router)
app.include_router(forecasts.router)
app.include_router(auth.router)
app.include_router(export_pdf.router)
app.include_router(subcontractor_reports.router)


@app.on_event("startup")
def startup_event():
    """Initialize database on startup."""
    init_db()
    
    # Seed crew types if empty
    db = SessionLocal()
    try:
        existing_crew_types = db.query(models.CrewType).count()
        if existing_crew_types == 0:
            crew_types_data = [
                {"name": "Fitters", "description": "Journeyman pipe fitters"},
                {"name": "Apprentices", "description": "Apprentice fitters"},
                {"name": "Foremen", "description": "Crew foremen / supervisors"},
                {"name": "Welders", "description": "Certified welders"},
                {"name": "Laborers", "description": "General labor"}
            ]
            
            for crew_type_data in crew_types_data:
                crew_type = models.CrewType(**crew_type_data)
                db.add(crew_type)
            
            db.commit()
            logger.info("Seeded default crew types")
    finally:
        db.close()


@app.get("/")
def root():
    """Root endpoint."""
    return {
        "message": "SprinkSync Manpower Forecast API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=True
    )
