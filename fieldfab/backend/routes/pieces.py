from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
from models import Piece, Project, User
from schemas import PieceCreate, PieceResponse

router = APIRouter(tags=["Pieces"])

FREE_PLAN_MAIN_PIPE_QTY_LIMIT = 10
FREE_PLAN_THREADED_PIPE_QTY_LIMIT = 10


def _get_owned_project(project_id: int, current_user: User, db: Session) -> Project:
    project = db.get(Project, project_id)
    if not project or project.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project


def _is_threaded_pipe(pipe_type: str) -> bool:
    return pipe_type.strip().lower() == "threaded pipe"


def _qty(value: int | None) -> int:
    return max(0, int(value or 0))


def _enforce_free_piece_limit(
    project_id: int,
    body: PieceCreate,
    current_user: User,
    db: Session,
    exclude_piece_id: int | None = None,
) -> None:
    if current_user.plan_type != "free":
        return

    is_threaded = _is_threaded_pipe(body.pipe_type)
    matching_pieces = db.query(Piece).filter(Piece.project_id == project_id).all()
    current_qty = sum(
        _qty(piece.qty)
        for piece in matching_pieces
        if piece.id != exclude_piece_id and _is_threaded_pipe(piece.pipe_type) == is_threaded
    )
    next_qty = current_qty + _qty(body.qty)
    limit = FREE_PLAN_THREADED_PIPE_QTY_LIMIT if is_threaded else FREE_PLAN_MAIN_PIPE_QTY_LIMIT
    label = "threaded pipe" if is_threaded else "grooved/welded main pipe"

    if next_qty > limit:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                f"Free plan is limited to {limit} pcs of {label} per project during development. "
                "Upgrade to Pro to create unlimited pieces."
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
    _enforce_free_piece_limit(project_id, body, current_user, db)
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
    _enforce_free_piece_limit(project_id, body, current_user, db, exclude_piece_id=piece_id)
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
