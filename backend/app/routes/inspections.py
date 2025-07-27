from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.construction import Inspection as InspectionModel
from app.schemas.construction import Inspection, InspectionCreate, InspectionUpdate

router = APIRouter()

@router.get("/", response_model=List[Inspection])
def get_inspections(project_id: int = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all inspections, optionally filtered by project"""
    query = db.query(InspectionModel)
    if project_id:
        query = query.filter(InspectionModel.project_id == project_id)
    inspections = query.offset(skip).limit(limit).all()
    return inspections

@router.post("/", response_model=Inspection)
def create_inspection(inspection: InspectionCreate, db: Session = Depends(get_db)):
    """Create a new inspection"""
    db_inspection = InspectionModel(**inspection.model_dump())
    db.add(db_inspection)
    db.commit()
    db.refresh(db_inspection)
    return db_inspection

@router.get("/{inspection_id}", response_model=Inspection)
def get_inspection(inspection_id: int, db: Session = Depends(get_db)):
    """Get a specific inspection by ID"""
    inspection = db.query(InspectionModel).filter(InspectionModel.id == inspection_id).first()
    if inspection is None:
        raise HTTPException(status_code=404, detail="Inspection not found")
    return inspection

@router.put("/{inspection_id}", response_model=Inspection)
def update_inspection(inspection_id: int, inspection_update: InspectionUpdate, db: Session = Depends(get_db)):
    """Update an inspection"""
    inspection = db.query(InspectionModel).filter(InspectionModel.id == inspection_id).first()
    if inspection is None:
        raise HTTPException(status_code=404, detail="Inspection not found")
    
    update_data = inspection_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(inspection, field, value)
    
    db.commit()
    db.refresh(inspection)
    return inspection

@router.get("/upcoming/")
def get_upcoming_inspections():
    """Get upcoming inspections"""
    return {
        "message": "Upcoming Inspections",
        "inspections": [
            {"type": "Foundation", "date": "2024-01-22", "inspector": "City Building Dept", "status": "scheduled"},
            {"type": "Framing", "date": "2024-02-05", "inspector": "City Building Dept", "status": "pending"},
            {"type": "Electrical Rough", "date": "2024-02-12", "inspector": "Electrical Inspector", "status": "pending"},
            {"type": "Plumbing Rough", "date": "2024-02-15", "inspector": "Plumbing Inspector", "status": "pending"}
        ]
    }
