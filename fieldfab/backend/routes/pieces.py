from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
from models import Piece, Project, User
from schemas import PieceCreate, PieceResponse

router = APIRouter(tags=["Pieces"])


def _get_owned_project(project_id: int, current_user: User, db: Session) -> Project:
    project = db.get(Project, project_id)
    if not project or project.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project


@router.get("/projects/{project_id}/pieces", response_model=list[PieceResponse])
def get_pieces(
    project_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    _get_owned_project(project_id, current_user, db)
    return db.query(Piece).filter(Piece.project_id == project_id).order_by(Piece.order_index).all()


@router.post("/projects/{project_id}/pieces", response_model=PieceResponse, status_code=status.HTTP_201_CREATED)
def create_piece(
    project_id: int,
    body: PieceCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    _get_owned_project(project_id, current_user, db)
    piece = Piece(project_id=project_id, **body.model_dump())
    db.add(piece)
    db.commit()
    db.refresh(piece)
    return piece


@router.put("/projects/{project_id}/pieces/{piece_id}", response_model=PieceResponse)
def update_piece(
    project_id: int,
    piece_id: int,
    body: PieceCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    _get_owned_project(project_id, current_user, db)
    piece = db.get(Piece, piece_id)
    if not piece or piece.project_id != project_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Piece not found")
    for field, value in body.model_dump().items():
        setattr(piece, field, value)
    db.commit()
    db.refresh(piece)
    return piece


@router.delete("/projects/{project_id}/pieces/{piece_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_piece(
    project_id: int,
    piece_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    _get_owned_project(project_id, current_user, db)
    piece = db.get(Piece, piece_id)
    if not piece or piece.project_id != project_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Piece not found")
    db.delete(piece)
    db.commit()
