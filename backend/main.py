from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import engine
from app.models.construction import Base
from app.models.auth import User, Company, UserInvitation, UserSession  # Import auth models
from app.api.api_v1.endpoints import projects
from app.routes.auth import router as auth_router
from config import get_settings  # Use new config system
from app.middleware.security import SecurityHeadersMiddleware, RequestLoggingMiddleware
import logging

# Get settings
settings = get_settings()

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SprinkSync Construction Management Platform",
    description="Modern construction management platform with comprehensive project tracking",
    version="1.0.0",
    debug=settings.DEBUG
)

# Add security middleware
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RequestLoggingMiddleware)

# CORS middleware with environment-based configuration
try:
    allowed_origins = settings.get_allowed_origins_list()
    if not allowed_origins:
        allowed_origins = ["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5173"]
except Exception:
    allowed_origins = ["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5173"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(projects.router, prefix="/api/projects", tags=["projects"])
app.include_router(auth_router, prefix="/api", tags=["authentication"])

@app.get("/")
async def root():
    return {"message": "SprinkSync Construction Management Platform API"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "construction-management-api"}

# Legacy endpoint for frontend compatibility - now redirects to new API
@app.get("/api/projects")
async def get_projects_legacy():
    """Legacy endpoint that redirects to the new database-driven API"""
    from fastapi import Depends
    from sqlalchemy.orm import Session
    from app.core.database import get_db
    from app.models.construction import Project
    
    # This is a simple redirect to maintain compatibility
    # In a real app, you'd want to properly dependency inject this
    return {"message": "Please use /api/projects/ (with trailing slash) for the new database API"}

# Dashboard endpoints (can be expanded later)
@app.get("/api/dashboard/stats")
async def get_dashboard_stats():
    from sqlalchemy.orm import Session
    from app.core.database import SessionLocal
    from app.models.construction import Project, Task, RFI, Inspection
    
    db = SessionLocal()
    try:
        total_projects = db.query(Project).count()
        active_projects = db.query(Project).filter(Project.status.in_(["In Progress", "Planning"])).count()
        total_tasks = db.query(Task).count()
        pending_inspections = db.query(Inspection).filter(Inspection.status == "scheduled").count()
        
        return {
            "stats": [
                {"label": "Total Projects", "value": total_projects, "change": "+12%"},
                {"label": "Active Projects", "value": active_projects, "change": "+8%"},
                {"label": "Total Tasks", "value": total_tasks, "change": "+15%"},
                {"label": "Pending Inspections", "value": pending_inspections, "change": "-3%"}
            ]
        }
    finally:
        db.close()

@app.get("/api/dashboard/alerts")
async def get_dashboard_alerts():
    return {
        "alerts": [
            {"type": "warning", "message": "Foundation inspection due tomorrow for Downtown Office Complex"},
            {"type": "info", "message": "New RFI submitted for Residential Tower A"},
            {"type": "success", "message": "Shopping Center Renovation milestone completed"}
        ]
    }

# Other endpoints (schedule, financials, etc.) can be added as needed
@app.get("/api/schedule")
async def get_schedule():
    return {"tasks": []}

@app.get("/api/financials")
async def get_financials():
    return {"financials": []}

@app.get("/api/documents")
async def get_documents():
    return {"documents": []}

@app.get("/api/field")
async def get_field():
    return {"field_data": []}

@app.get("/api/inspections")
async def get_inspections():
    return {"inspections": []}

@app.get("/api/reports")
async def get_reports():
    return {"reports": []}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
