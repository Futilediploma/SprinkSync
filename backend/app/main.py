from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import projects, schedule, financials, documents, field, inspections, reports
from core.config import settings

app = FastAPI(
    title="Construction Management Platform",
    description="Modern construction management platform with comprehensive project tracking",
    version="1.0.0"
)

# CORS middleware for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # React dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(projects.router, prefix="/api/projects", tags=["projects"])
app.include_router(schedule.router, prefix="/api/schedule", tags=["schedule"])
app.include_router(financials.router, prefix="/api/financials", tags=["financials"])
app.include_router(documents.router, prefix="/api/documents", tags=["documents"])
app.include_router(field.router, prefix="/api/field", tags=["field"])
app.include_router(inspections.router, prefix="/api/inspections", tags=["inspections"])
app.include_router(reports.router, prefix="/api/reports", tags=["reports"])

@app.get("/")
async def root():
    return {"message": "Construction Management Platform API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "Construction Management Platform is running"}
