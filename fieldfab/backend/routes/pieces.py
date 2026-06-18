from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
from models import Piece, Project, User
from schemas import PieceCreate, PieceResponse
from access import (
    PRE_TRIAL_PIPE_QTY_LIMIT,
    pre_trial_edit_allowed,
    require_mutation_access,
)

router = APIRouter(tags=["Pieces"])

def _get_owned_project(project_id: int, current_user: User, db: Session) -> Project:
    project = db.get(Project, project_id)
    if not project or project.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project


def _qty(value: int | None) -> int:
    return max(0, int(value or 0))


def _account_pipe_qty(current_user: User, db: Session) -> int:
    pieces = (
        db.query(Piece)
        .join(Project, Piece.project_id == Project.id)
        .filter(Project.user_id == current_user.id)
        .all()
    )
    return sum(_qty(piece.qty) for piece in pieces)


def _enforce_pre_trial_piece_limit(
    body: PieceCreate,
    current_user: User,
    db: Session,
    existing_piece: Piece | None = None,
) -> None:
    if require_mutation_access(current_user) != "pre_trial":
        return

    current_total = _account_pipe_qty(current_user, db)
    if existing_piece:
        allowed = pre_trial_edit_allowed(current_total, _qty(existing_piece.qty), _qty(body.qty))
    else:
        allowed = current_total + _qty(body.qty) <= PRE_TRIAL_PIPE_QTY_LIMIT

    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                f"Before your first export, FieldFab is limited to {PRE_TRIAL_PIPE_QTY_LIMIT} total pipe pieces. "
                "Export to start your 15-day full-feature trial."
            ),
        )


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
    _enforce_pre_trial_piece_limit(body, current_user, db)
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
    _enforce_pre_trial_piece_limit(body, current_user, db, existing_piece=piece)
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
    require_mutation_access(current_user)
    piece = db.get(Piece, piece_id)
    if not piece or piece.project_id != project_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Piece not found")
    db.delete(piece)
    db.commit()
