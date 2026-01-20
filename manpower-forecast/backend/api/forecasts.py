"""Forecast API endpoints."""
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, timedelta
import crud
import schemas
import models
from database import get_db
from services.manpower import generate_forecast
from services.export import generate_forecast_csv, generate_project_breakdown_csv
from api.auth import get_current_active_user

router = APIRouter(prefix="/api/forecasts", tags=["forecasts"])


@router.get("/company-wide", response_model=schemas.ManpowerForecast)
def get_company_wide_forecast(
    start_date: date = Query(..., description="Forecast start date (YYYY-MM-DD)"),
    end_date: date = Query(..., description="Forecast end date (YYYY-MM-DD)"),
    project_ids: Optional[str] = Query(None, description="Comma-separated project IDs"),
    crew_type_ids: Optional[str] = Query(None, description="Comma-separated crew type IDs"),
    granularity: str = Query("weekly", description="weekly or monthly"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Get company-wide manpower forecast.
    
    Aggregates manpower across all active projects within the date range.
    """
    # Validate dates
    if end_date < start_date:
        raise HTTPException(status_code=400, detail="end_date must be >= start_date")
    
    # Parse comma-separated IDs
    project_id_list = None
    if project_ids:
        try:
            project_id_list = [int(id.strip()) for id in project_ids.split(',')]
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid project_ids format")
    
    crew_type_id_list = None
    if crew_type_ids:
        try:
            crew_type_id_list = [int(id.strip()) for id in crew_type_ids.split(',')]
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid crew_type_ids format")
    
    # Get active phases in date range
    phases = crud.get_active_phases_in_date_range(
        db,
        start_date,
        end_date,
        project_ids=project_id_list,
        crew_type_ids=crew_type_id_list
    )
    
    # Generate forecast
    forecast = generate_forecast(phases, start_date, end_date, granularity)
    
    return forecast


@router.get("/project/{project_id}", response_model=schemas.ManpowerForecast)
def get_project_forecast(
    project_id: int,
    granularity: str = Query("weekly", description="weekly or monthly"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Get manpower forecast for a single project.
    """
    # Check if project exists
    project = crud.get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Get project schedule
    schedule = crud.get_project_schedule(db, project_id)
    if not schedule:
        raise HTTPException(status_code=404, detail="No schedule found for this project")
    
    # Get all phases
    phases = crud.get_schedule_phases(db, schedule.id)
    
    if not phases:
        # Return empty forecast
        return {
            'start_date': schedule.start_date,
            'end_date': schedule.end_date,
            'total_man_hours': 0,
            'project_count': 1,
            'weekly_forecast': [],
            'monthly_forecast': [],
            'projects_included': []
        }
    
    # Use schedule dates as range
    forecast = generate_forecast(phases, schedule.start_date, schedule.end_date, granularity)
    
    return forecast


@router.get("/company-wide/export")
def export_company_forecast(
    start_date: date = Query(...),
    end_date: date = Query(...),
    project_ids: Optional[str] = Query(None),
    crew_type_ids: Optional[str] = Query(None),
    granularity: str = Query("weekly"),
    export_type: str = Query("forecast", description="forecast or projects"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Export company-wide forecast as CSV.
    """
    # Parse IDs
    project_id_list = None
    if project_ids:
        try:
            project_id_list = [int(id.strip()) for id in project_ids.split(',')]
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid project_ids format")
    
    crew_type_id_list = None
    if crew_type_ids:
        try:
            crew_type_id_list = [int(id.strip()) for id in crew_type_ids.split(',')]
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid crew_type_ids format")
    
    # Get phases and generate forecast
    phases = crud.get_active_phases_in_date_range(
        db, start_date, end_date, project_id_list, crew_type_id_list
    )
    forecast = generate_forecast(phases, start_date, end_date, granularity)
    
    # Generate CSV based on export type
    if export_type == "projects":
        csv_content = generate_project_breakdown_csv(forecast['projects_included'])
        filename = f"project_breakdown_{start_date}_{end_date}.csv"
    else:
        csv_content = generate_forecast_csv(forecast, granularity)
        filename = f"manpower_forecast_{granularity}_{start_date}_{end_date}.csv"
    
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
