"""Subcontractor report API endpoints."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date
from decimal import Decimal
import crud
import schemas
import models
from database import get_db
from api.auth import get_current_active_user

router = APIRouter(prefix="/api/reports", tags=["subcontractor-reports"])

# Hardcoded list of valid subcontractors
VALID_SUBCONTRACTORS = ["Dynalectric", "Fuentes", "Power Solutions", "Power Plus"]


@router.get("/subcontractors")
def list_subcontractors(
    current_user: models.User = Depends(get_current_active_user)
):
    """Get list of available subcontractors."""
    return {"subcontractors": VALID_SUBCONTRACTORS}


@router.get("/subcontractor/{subcontractor_name}", response_model=schemas.SubcontractorReport)
def get_subcontractor_report(
    subcontractor_name: str,
    start_date: Optional[date] = Query(None, description="Filter by start date"),
    end_date: Optional[date] = Query(None, description="Filter by end date"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Get labor report for a specific subcontractor.

    Shows all projects and phases assigned to this subcontractor.
    """
    # Validate subcontractor name
    if subcontractor_name not in VALID_SUBCONTRACTORS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid subcontractor. Must be one of: {', '.join(VALID_SUBCONTRACTORS)}"
        )

    # Get all projects assigned to this subcontractor
    project_assignments = crud.get_projects_by_subcontractor(
        db, subcontractor_name, start_date, end_date
    )

    total_man_hours = Decimal('0')
    projects_info = []

    for project, labor_type in project_assignments:
        # Get phases for this project
        phases = crud.get_project_phases_for_labor_type(
            db, project.id, labor_type, start_date, end_date
        )

        phases_info = []
        project_hours = Decimal('0')

        for phase in phases:
            # Calculate man hours for this phase
            if phase.estimated_man_hours:
                phase_hours = Decimal(str(phase.estimated_man_hours))
            elif phase.crew_size:
                duration_days = (phase.end_date - phase.start_date).days + 1
                phase_hours = Decimal(str(phase.crew_size)) * Decimal('8') * Decimal(str(duration_days))
            else:
                phase_hours = Decimal('0')

            project_hours += phase_hours

            phases_info.append({
                "phase_name": phase.phase_name,
                "start_date": phase.start_date,
                "end_date": phase.end_date,
                "man_hours": phase_hours
            })

        total_man_hours += project_hours

        projects_info.append({
            "project_id": project.id,
            "project_name": project.name,
            "project_number": project.project_number,
            "labor_type": labor_type,
            "phases": phases_info,
            "total_project_hours": project_hours
        })

    return {
        "subcontractor_name": subcontractor_name,
        "total_man_hours": total_man_hours,
        "projects": projects_info
    }
