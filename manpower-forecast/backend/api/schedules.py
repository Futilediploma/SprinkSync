"""Schedule and phase API endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import crud
import schemas
from database import get_db

router = APIRouter(prefix="/api", tags=["schedules"])


# ============================================
# Schedule Endpoints
# ============================================

@router.put("/schedules/{schedule_id}", response_model=schemas.ProjectSchedule)
def update_schedule(
    schedule_id: int,
    schedule: schemas.ProjectScheduleUpdate,
    db: Session = Depends(get_db)
):
    """Update project schedule."""
    updated_schedule = crud.update_project_schedule(db, schedule_id, schedule)
    if not updated_schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    return updated_schedule


# ============================================
# Phase Endpoints
# ============================================

@router.get("/schedules/{schedule_id}/phases", response_model=List[schemas.SchedulePhase])
def list_phases(schedule_id: int, db: Session = Depends(get_db)):
    """Get all phases for a schedule."""
    return crud.get_schedule_phases(db, schedule_id)


@router.post("/schedules/{schedule_id}/phases", response_model=schemas.SchedulePhase)
def create_phase(
    schedule_id: int,
    phase: schemas.SchedulePhaseCreate,
    db: Session = Depends(get_db)
):
    """Add a phase to a schedule."""
    return crud.create_schedule_phase(db, schedule_id, phase)


@router.get("/phases/{phase_id}", response_model=schemas.SchedulePhase)
def get_phase(phase_id: int, db: Session = Depends(get_db)):
    """Get phase by ID."""
    phase = crud.get_schedule_phase(db, phase_id)
    if not phase:
        raise HTTPException(status_code=404, detail="Phase not found")
    return phase


@router.put("/phases/{phase_id}", response_model=schemas.SchedulePhase)
def update_phase(
    phase_id: int,
    phase: schemas.SchedulePhaseUpdate,
    db: Session = Depends(get_db)
):
    """Update phase."""
    updated_phase = crud.update_schedule_phase(db, phase_id, phase)
    if not updated_phase:
        raise HTTPException(status_code=404, detail="Phase not found")
    return updated_phase


@router.delete("/phases/{phase_id}")
def delete_phase(phase_id: int, db: Session = Depends(get_db)):
    """Delete phase."""
    success = crud.delete_schedule_phase(db, phase_id)
    if not success:
        raise HTTPException(status_code=404, detail="Phase not found")
    return {"message": "Phase deleted successfully"}
