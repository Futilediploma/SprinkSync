"""Project API endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
import crud
import schemas
from database import get_db

router = APIRouter(prefix="/api/projects", tags=["projects"])


@router.get("/", response_model=List[schemas.Project])
def list_projects(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get list of projects."""
    return crud.get_projects(db, skip=skip, limit=limit, status=status)


@router.post("/", response_model=schemas.Project)
def create_project(project: schemas.ProjectCreate, db: Session = Depends(get_db)):
    """Create a new project."""
    return crud.create_project(db, project)


@router.get("/{project_id}", response_model=schemas.Project)
def get_project(project_id: int, db: Session = Depends(get_db)):
    """Get project by ID."""
    project = crud.get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.put("/{project_id}", response_model=schemas.Project)
def update_project(
    project_id: int,
    project: schemas.ProjectUpdate,
    db: Session = Depends(get_db)
):
    """Update project."""
    updated_project = crud.update_project(db, project_id, project)
    if not updated_project:
        raise HTTPException(status_code=404, detail="Project not found")
    return updated_project


@router.delete("/{project_id}")
def delete_project(project_id: int, db: Session = Depends(get_db)):
    """Delete project."""
    success = crud.delete_project(db, project_id)
    if not success:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"message": "Project deleted successfully"}


@router.get("/{project_id}/schedule", response_model=schemas.ProjectSchedule)
def get_project_schedule(project_id: int, db: Session = Depends(get_db)):
    """Get project schedule."""
    # First check if project exists
    project = crud.get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    schedule = crud.get_project_schedule(db, project_id)
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found for this project")
    return schedule


@router.post("/{project_id}/schedule", response_model=schemas.ProjectSchedule)
def create_project_schedule(
    project_id: int,
    schedule: schemas.ProjectScheduleCreate,
    db: Session = Depends(get_db)
):
    """Create or update project schedule."""
    # Check if project exists
    project = crud.get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return crud.create_project_schedule(db, project_id, schedule)


@router.delete("/{project_id}/schedule")
def delete_project_schedule(project_id: int, db: Session = Depends(get_db)):
    """Delete project schedule."""
    schedule = crud.get_project_schedule(db, project_id)
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    
    success = crud.delete_project_schedule(db, schedule.id)
    if not success:
        raise HTTPException(status_code=404, detail="Schedule not found")
    return {"message": "Schedule deleted successfully"}
