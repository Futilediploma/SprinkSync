from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="SprinkSync Construction Management Platform",
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

@app.get("/")
async def root():
    return {"message": "SprinkSync Construction Management Platform API"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "construction-management-api"}

# Basic endpoints for testing
@app.get("/api/projects")
async def get_projects():
    return {
        "projects": [
            {
                "id": 1,
                "name": "Downtown Office Complex",
                "status": "In Progress",
                "progress": 75,
                "budget": 2500000,
                "deadline": "2024-12-15"
            },
            {
                "id": 2,
                "name": "Residential Tower A",
                "status": "Planning",
                "progress": 15,
                "budget": 8000000,
                "deadline": "2025-08-30"
            },
            {
                "id": 3,
                "name": "Shopping Center Renovation",
                "status": "In Progress",
                "progress": 45,
                "budget": 3200000,
                "deadline": "2024-09-20"
            },
            {
                "id": 4,
                "name": "Industrial Warehouse",
                "status": "Completed",
                "progress": 100,
                "budget": 1800000,
                "deadline": "2024-06-10"
            }
        ]
    }

@app.get("/api/dashboard/stats")
async def get_dashboard_stats():
    return {
        "stats": [
            {
                "name": "Active Projects",
                "value": "12",
                "change": "+2.1%",
                "changeType": "positive"
            },
            {
                "name": "Total Budget",
                "value": "$24.5M", 
                "change": "+5.4%",
                "changeType": "positive"
            },
            {
                "name": "Team Members",
                "value": "156",
                "change": "+12.5%",
                "changeType": "positive"
            },
            {
                "name": "Completion Rate",
                "value": "78%",
                "change": "+8.2%",
                "changeType": "positive"
            }
        ]
    }

@app.get("/api/dashboard/alerts")
async def get_dashboard_alerts():
    return {
        "alerts": [
            {
                "type": "warning",
                "message": "Downtown Office Complex budget variance detected",
                "time": "2 hours ago"
            },
            {
                "type": "info", 
                "message": "New inspection scheduled for Residential Tower A",
                "time": "4 hours ago"
            },
            {
                "type": "success",
                "message": "Industrial Warehouse project completed successfully", 
                "time": "1 day ago"
            }
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
