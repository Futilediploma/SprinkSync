"""CRUD operations for database models."""
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
import models
import schemas


# ============================================
# Project CRUD
# ============================================

def get_projects(db: Session, skip: int = 0, limit: int = 100, status: Optional[str] = None) -> List[models.Project]:
    """Get list of projects."""
    query = db.query(models.Project)
    if status:
        query = query.filter(models.Project.status == status)
    return query.offset(skip).limit(limit).all()


def get_project(db: Session, project_id: int) -> Optional[models.Project]:
    """Get project by ID."""
    return db.query(models.Project).filter(models.Project.id == project_id).first()


def create_project(db: Session, project: schemas.ProjectCreate) -> models.Project:
    """Create new project."""
    db_project = models.Project(**project.model_dump())
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project


def update_project(db: Session, project_id: int, project: schemas.ProjectUpdate) -> Optional[models.Project]:
    """Update project."""
    db_project = get_project(db, project_id)
    if not db_project:
        return None
    
    update_data = project.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_project, field, value)
    
    db.commit()
    db.refresh(db_project)
    return db_project


def delete_project(db: Session, project_id: int) -> bool:
    """Delete project."""
    db_project = get_project(db, project_id)
    if not db_project:
        return False
    
    db.delete(db_project)
    db.commit()
    return True


# ============================================
# Crew Type CRUD
# ============================================

def get_crew_types(db: Session) -> List[models.CrewType]:
    """Get all crew types."""
    return db.query(models.CrewType).all()


def get_crew_type(db: Session, crew_type_id: int) -> Optional[models.CrewType]:
    """Get crew type by ID."""
    return db.query(models.CrewType).filter(models.CrewType.id == crew_type_id).first()


def create_crew_type(db: Session, crew_type: schemas.CrewTypeCreate) -> models.CrewType:
    """Create new crew type."""
    db_crew_type = models.CrewType(**crew_type.model_dump())
    db.add(db_crew_type)
    db.commit()
    db.refresh(db_crew_type)
    return db_crew_type


# ============================================
# Project Schedule CRUD
# ============================================

def get_project_schedule(db: Session, project_id: int) -> Optional[models.ProjectSchedule]:
    """Get project schedule (most recent active)."""
    return db.query(models.ProjectSchedule).filter(
        models.ProjectSchedule.project_id == project_id,
        models.ProjectSchedule.is_active == True
    ).first()


def create_project_schedule(
    db: Session, 
    project_id: int, 
    schedule: schemas.ProjectScheduleCreate
) -> models.ProjectSchedule:
    """Create new project schedule."""
    schedule_data = schedule.model_dump(exclude={'phases'})
    db_schedule = models.ProjectSchedule(project_id=project_id, **schedule_data)
    db.add(db_schedule)
    db.commit()
    db.refresh(db_schedule)
    
    # Add phases if provided
    if schedule.phases:
        for phase in schedule.phases:
            create_schedule_phase(db, db_schedule.id, phase)
        db.refresh(db_schedule)
    
    return db_schedule


def update_project_schedule(
    db: Session, 
    schedule_id: int, 
    schedule: schemas.ProjectScheduleUpdate
) -> Optional[models.ProjectSchedule]:
    """Update project schedule."""
    db_schedule = db.query(models.ProjectSchedule).filter(models.ProjectSchedule.id == schedule_id).first()
    if not db_schedule:
        return None
    
    update_data = schedule.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_schedule, field, value)
    
    db.commit()
    db.refresh(db_schedule)
    return db_schedule


def delete_project_schedule(db: Session, schedule_id: int) -> bool:
    """Delete project schedule."""
    db_schedule = db.query(models.ProjectSchedule).filter(models.ProjectSchedule.id == schedule_id).first()
    if not db_schedule:
        return False
    
    db.delete(db_schedule)
    db.commit()
    return True


# ============================================
# Schedule Phase CRUD
# ============================================

def get_schedule_phases(db: Session, schedule_id: int) -> List[models.SchedulePhase]:
    """Get all phases for a schedule."""
    return db.query(models.SchedulePhase).filter(
        models.SchedulePhase.schedule_id == schedule_id
    ).order_by(models.SchedulePhase.sort_order, models.SchedulePhase.start_date).all()


def get_schedule_phase(db: Session, phase_id: int) -> Optional[models.SchedulePhase]:
    """Get schedule phase by ID."""
    return db.query(models.SchedulePhase).filter(models.SchedulePhase.id == phase_id).first()


def create_schedule_phase(
    db: Session, 
    schedule_id: int, 
    phase: schemas.SchedulePhaseCreate
) -> models.SchedulePhase:
    """Create new schedule phase."""
    db_phase = models.SchedulePhase(schedule_id=schedule_id, **phase.model_dump())
    db.add(db_phase)
    db.commit()
    db.refresh(db_phase)
    return db_phase


def update_schedule_phase(
    db: Session, 
    phase_id: int, 
    phase: schemas.SchedulePhaseUpdate
) -> Optional[models.SchedulePhase]:
    """Update schedule phase."""
    db_phase = get_schedule_phase(db, phase_id)
    if not db_phase:
        return None
    
    update_data = phase.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_phase, field, value)
    
    db.commit()
    db.refresh(db_phase)
    return db_phase


def delete_schedule_phase(db: Session, phase_id: int) -> bool:
    """Delete schedule phase."""
    db_phase = get_schedule_phase(db, phase_id)
    if not db_phase:
        return False
    
    db.delete(db_phase)
    db.commit()
    return True


# ============================================
# Query Helpers for Forecasting
# ============================================

def get_active_phases_in_date_range(
    db: Session,
    start_date: date,
    end_date: date,
    project_ids: Optional[List[int]] = None,
    crew_type_ids: Optional[List[int]] = None
) -> List[models.SchedulePhase]:
    """Get all active phases within a date range."""
    query = db.query(models.SchedulePhase).join(
        models.ProjectSchedule
    ).join(
        models.Project
    ).filter(
        models.Project.status.in_(['active', 'prospective']),
        models.SchedulePhase.start_date <= end_date,
        models.SchedulePhase.end_date >= start_date
    )
    
    if project_ids:
        query = query.filter(models.Project.id.in_(project_ids))
    
    if crew_type_ids:
        query = query.filter(models.SchedulePhase.crew_type_id.in_(crew_type_ids))
    
    return query.all()
