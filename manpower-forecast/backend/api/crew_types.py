"""Crew type API endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import crud
import schemas
import models
from database import get_db
from api.auth import get_current_active_user

router = APIRouter(prefix="/api/crew-types", tags=["crew-types"])


@router.get("/", response_model=List[schemas.CrewType])
def list_crew_types(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get all crew types."""
    return crud.get_crew_types(db)


@router.post("/", response_model=schemas.CrewType)
def create_crew_type(
    crew_type: schemas.CrewTypeCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Create a new crew type."""
    return crud.create_crew_type(db, crew_type)


@router.get("/{crew_type_id}", response_model=schemas.CrewType)
def get_crew_type(
    crew_type_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get crew type by ID."""
    crew_type = crud.get_crew_type(db, crew_type_id)
    if not crew_type:
        raise HTTPException(status_code=404, detail="Crew type not found")
    return crew_type
