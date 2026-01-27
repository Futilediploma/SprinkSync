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
    project_data = project.model_dump(exclude={'subcontractors'})
    db_project = models.Project(**project_data)
    db.add(db_project)
    try:
        db.commit()
        db.refresh(db_project)

        # Add subcontractors if provided
        if project.subcontractors:
            for sub in project.subcontractors:
                db_sub = models.ProjectSubcontractor(
                    project_id=db_project.id,
                    subcontractor_name=sub.subcontractor_name,
                    labor_type=sub.labor_type
                )
                db.add(db_sub)
            db.commit()
            db.refresh(db_project)
    except Exception:
        db.rollback()
        raise
    return db_project


def update_project(db: Session, project_id: int, project: schemas.ProjectUpdate) -> Optional[models.Project]:
    """Update project."""
    db_project = get_project(db, project_id)
    if not db_project:
        return None

    update_data = project.model_dump(exclude_unset=True, exclude={'subcontractors'})
    for field, value in update_data.items():
        setattr(db_project, field, value)

    # Handle subcontractors if provided
    if project.subcontractors is not None:
        # Delete existing subcontractors
        db.query(models.ProjectSubcontractor).filter(
            models.ProjectSubcontractor.project_id == project_id
        ).delete()
        # Add new subcontractors
        for sub in project.subcontractors:
            db_sub = models.ProjectSubcontractor(
                project_id=project_id,
                subcontractor_name=sub.subcontractor_name,
                labor_type=sub.labor_type
            )
            db.add(db_sub)

    try:
        db.commit()
        db.refresh(db_project)
    except Exception:
        db.rollback()
        raise
    return db_project


def delete_project(db: Session, project_id: int) -> bool:
    """Delete project."""
    db_project = get_project(db, project_id)
    if not db_project:
        return False

    db.delete(db_project)
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise
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
    try:
        db.commit()
        db.refresh(db_crew_type)
    except Exception:
        db.rollback()
        raise
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
    try:
        db.commit()
        db.refresh(db_schedule)

        # Add phases if provided
        if schedule.phases:
            for phase in schedule.phases:
                create_schedule_phase(db, db_schedule.id, phase)
            db.refresh(db_schedule)
    except Exception:
        db.rollback()
        raise

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

    try:
        db.commit()
        db.refresh(db_schedule)
    except Exception:
        db.rollback()
        raise
    return db_schedule


def delete_project_schedule(db: Session, schedule_id: int) -> bool:
    """Delete project schedule."""
    db_schedule = db.query(models.ProjectSchedule).filter(models.ProjectSchedule.id == schedule_id).first()
    if not db_schedule:
        return False

    db.delete(db_schedule)
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise
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
    try:
        db.commit()
        db.refresh(db_phase)
    except Exception:
        db.rollback()
        raise
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

    try:
        db.commit()
        db.refresh(db_phase)
    except Exception:
        db.rollback()
        raise
    return db_phase


def delete_schedule_phase(db: Session, phase_id: int) -> bool:
    """Delete schedule phase."""
    db_phase = get_schedule_phase(db, phase_id)
    if not db_phase:
        return False

    db.delete(db_phase)
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise
    return True


# ============================================
# Query Helpers for Forecasting
# ============================================

# ============================================
# PDF Export Helpers
# ============================================
def get_all_projects(db: Session):
    """Get all projects."""
    return db.query(models.Project).all()

def get_all_phases(db: Session):
    """Get all schedule phases for all projects."""
    return db.query(models.SchedulePhase).all()

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


# ============================================
# Subcontractor CRUD
# ============================================

def get_projects_by_subcontractor(
    db: Session,
    subcontractor_name: str,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None
) -> List[tuple]:
    """Get all projects assigned to a subcontractor with their labor types."""
    query = db.query(
        models.Project,
        models.ProjectSubcontractor.labor_type
    ).join(
        models.ProjectSubcontractor
    ).filter(
        models.ProjectSubcontractor.subcontractor_name == subcontractor_name,
        models.Project.status.in_(['active', 'prospective'])
    )

    if start_date:
        query = query.filter(models.Project.end_date >= start_date)
    if end_date:
        query = query.filter(models.Project.start_date <= end_date)

    return query.all()


def get_project_phases_for_labor_type(
    db: Session,
    project_id: int,
    labor_type: str,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None
) -> List[models.SchedulePhase]:
    """Get phases for a project filtered by labor type (sprinkler/vesda)."""
    query = db.query(models.SchedulePhase).join(
        models.ProjectSchedule
    ).join(
        models.Project
    ).filter(
        models.ProjectSchedule.project_id == project_id,
        models.ProjectSchedule.is_active == True
    )

    if start_date:
        query = query.filter(models.SchedulePhase.end_date >= start_date)
    if end_date:
        query = query.filter(models.SchedulePhase.start_date <= end_date)

    return query.order_by(models.SchedulePhase.start_date).all()
