from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.construction import Project as ProjectModel
from app.schemas.construction import Project, ProjectCreate, ProjectUpdate

router = APIRouter()

@router.get("/", response_model=List[Project])
def get_projects(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all projects with pagination"""
    projects = db.query(ProjectModel).offset(skip).limit(limit).all()
    return projects

@router.post("/", response_model=Project)
def create_project(project: ProjectCreate, db: Session = Depends(get_db)):
    """Create a new project"""
    db_project = ProjectModel(**project.model_dump())
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project

@router.get("/{project_id}", response_model=Project)
def get_project(project_id: int, db: Session = Depends(get_db)):
    """Get a specific project by ID"""
    project = db.query(ProjectModel).filter(ProjectModel.id == project_id).first()
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@router.put("/{project_id}", response_model=Project)
def update_project(project_id: int, project_update: ProjectUpdate, db: Session = Depends(get_db)):
    """Update a project"""
    project = db.query(ProjectModel).filter(ProjectModel.id == project_id).first()
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    
    update_data = project_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(project, field, value)
    
    db.commit()
    db.refresh(project)
    return project

@router.delete("/{project_id}")
def delete_project(project_id: int, db: Session = Depends(get_db)):
    """Delete a project"""
    project = db.query(ProjectModel).filter(ProjectModel.id == project_id).first()
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    
    db.delete(project)
    db.commit()
    return {"message": "Project deleted successfully"}
