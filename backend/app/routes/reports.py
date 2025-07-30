from fastapi import APIRouter, Depends
from app.utils.roles import require_roles, ADMIN, PROJECT_MANAGER

router = APIRouter()

@router.get("/", dependencies=[Depends(require_roles([ADMIN, PROJECT_MANAGER]))])
def get_reports():
    """Get reports overview"""
    return {
        "message": "Reports endpoint",
        "available_reports": [
            {"name": "Project Status", "type": "dashboard", "last_generated": "2024-01-18"},
            {"name": "Cost Analysis", "type": "financial", "last_generated": "2024-01-17"},
            {"name": "Schedule Performance", "type": "timeline", "last_generated": "2024-01-18"},
            {"name": "Safety Report", "type": "safety", "last_generated": "2024-01-15"},
            {"name": "Quality Control", "type": "quality", "last_generated": "2024-01-16"}
        ]
    }

@router.get("/dashboard", dependencies=[Depends(require_roles([ADMIN, PROJECT_MANAGER]))])
def get_dashboard_data():
    """Get dashboard summary data"""
    return {
        "project_summary": {
            "total_projects": 5,
            "active_projects": 3,
            "completed_projects": 2,
            "total_budget": 7500000,
            "budget_utilized": 4200000
        },
        "schedule_summary": {
            "tasks_on_schedule": 85,
            "tasks_behind": 12,
            "tasks_ahead": 8,
            "overall_schedule_health": "Good"
        },
        "quality_metrics": {
            "inspections_passed": 45,
            "inspections_failed": 3,
            "rfi_open": 8,
            "rfi_closed": 25
        }
    }
