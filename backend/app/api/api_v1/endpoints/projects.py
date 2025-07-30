from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.construction import Project
from app.schemas.construction import ProjectCreate, ProjectUpdate, Project as ProjectSchema

router = APIRouter()

@router.get("/", response_model=List[ProjectSchema])
def get_projects(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all projects with pagination"""
    projects = db.query(Project).offset(skip).limit(limit).all()
    return projects

@router.get("/{project_id}", response_model=ProjectSchema)
def get_project(
    project_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific project by ID"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    return project

@router.post("/", response_model=ProjectSchema)
def create_project(
    project: ProjectCreate,
    db: Session = Depends(get_db)
):
    """Create a new project"""
    # Check if job number already exists (if provided)
    if project.job_number:
        existing = db.query(Project).filter(Project.job_number == project.job_number).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Project with this job number already exists"
            )
    
    db_project = Project(**project.model_dump())
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project

@router.put("/{project_id}", response_model=ProjectSchema)
def update_project(
    project_id: int,
    project_update: ProjectUpdate,
    db: Session = Depends(get_db)
):
    """Update an existing project"""
    db_project = db.query(Project).filter(Project.id == project_id).first()
    if not db_project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Update only provided fields
    update_data = project_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_project, field, value)
    
    db.commit()
    db.refresh(db_project)
    return db_project

@router.delete("/{project_id}")
def delete_project(
    project_id: int,
    db: Session = Depends(get_db)
):
    """Delete a project"""
    db_project = db.query(Project).filter(Project.id == project_id).first()
    if not db_project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    db.delete(db_project)
    db.commit()
    return {"message": "Project deleted successfully"}

@router.get("/{project_id}/summary")
def get_project_summary(
    project_id: int,
    db: Session = Depends(get_db)
):
    """Get project summary with related data"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Calculate progress based on tasks
    total_tasks = len(project.tasks)
    completed_tasks = len([task for task in project.tasks if task.status == "completed"])
    progress = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
    
    return {
        "project": project,
        "stats": {
            "total_tasks": total_tasks,
            "completed_tasks": completed_tasks,
            "progress": round(progress, 1),
            "open_rfis": len([rfi for rfi in project.rfis if rfi.status == "open"]),
            "active_change_orders": len([co for co in project.change_orders if co.status == "approved"]),
            "upcoming_inspections": len([insp for insp in project.inspections if insp.status == "scheduled"])
        }
    }
