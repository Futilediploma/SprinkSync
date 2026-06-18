from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
from models import Project, User
from schemas import ProjectCreate, ProjectResponse
from access import PRE_TRIAL_PROJECT_LIMIT, require_mutation_access

router = APIRouter(prefix="/projects", tags=["Projects"])

@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    body: ProjectCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    access_state = require_mutation_access(current_user)
    if access_state == "pre_trial":
        project_count = db.query(Project).filter(Project.user_id == current_user.id).count()
        if project_count >= PRE_TRIAL_PROJECT_LIMIT:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "Before your first export, FieldFab is limited to one project. "
                    "Export to start your 15-day full-feature trial."
                ),
            )

    project = Project(
        user_id=current_user.id,
        name=body.name,
        company_name=body.company_name,
        street_number=body.street_number,
        street_name=body.street_name,
        city=body.city,
        zipcode=body.zipcode,
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@router.get("", response_model=list[ProjectResponse])
def get_projects(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    return db.query(Project).filter(Project.user_id == current_user.id).all()
