from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
from models import LooseMaterial, Project, User
from schemas import LooseMaterialCreate, LooseMaterialResponse
from access import require_mutation_access

router = APIRouter(tags=["LooseMaterials"])


def _get_owned_project(project_id: int, current_user: User, db: Session) -> Project:
    project = db.get(Project, project_id)
    if not project or project.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project


@router.get("/projects/{project_id}/loose-materials", response_model=list[LooseMaterialResponse])
def get_loose_materials(
    project_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    _get_owned_project(project_id, current_user, db)
    return (
        db.query(LooseMaterial)
        .filter(LooseMaterial.project_id == project_id)
        .order_by(LooseMaterial.order_index)
        .all()
    )


@router.post(
    "/projects/{project_id}/loose-materials",
    response_model=LooseMaterialResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_loose_material(
    project_id: int,
    body: LooseMaterialCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    _get_owned_project(project_id, current_user, db)
    require_mutation_access(current_user)
    mat = LooseMaterial(project_id=project_id, **body.model_dump())
    db.add(mat)
    db.commit()
    db.refresh(mat)
    return mat


@router.put(
    "/projects/{project_id}/loose-materials/{mat_id}",
    response_model=LooseMaterialResponse,
)
def update_loose_material(
    project_id: int,
    mat_id: int,
    body: LooseMaterialCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    _get_owned_project(project_id, current_user, db)
    require_mutation_access(current_user)
    mat = db.get(LooseMaterial, mat_id)
    if not mat or mat.project_id != project_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Material not found")
    for field, value in body.model_dump().items():
        setattr(mat, field, value)
    db.commit()
    db.refresh(mat)
    return mat


@router.delete(
    "/projects/{project_id}/loose-materials/{mat_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_loose_material(
    project_id: int,
    mat_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    _get_owned_project(project_id, current_user, db)
    require_mutation_access(current_user)
    mat = db.get(LooseMaterial, mat_id)
    if not mat or mat.project_id != project_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Material not found")
    db.delete(mat)
    db.commit()
