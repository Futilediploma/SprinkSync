"""Employee directory endpoints for internal manpower notifications."""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db
from permissions import require_editor, require_viewer


router = APIRouter(prefix="/api/employees", tags=["employees"])


@router.get("", response_model=List[schemas.Employee], include_in_schema=False)
@router.get("/", response_model=List[schemas.Employee])
def list_employees(
    active: Optional[bool] = Query(None),
    role: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_viewer),
):
    """List employees for office dropdowns."""
    query = db.query(models.Employee)
    if active is not None:
        query = query.filter(models.Employee.active == active)
    if role:
        query = query.filter(models.Employee.role == role)
    return query.order_by(models.Employee.name.asc()).all()


@router.post("", response_model=schemas.Employee, include_in_schema=False)
@router.post("/", response_model=schemas.Employee)
def create_employee(
    employee: schemas.EmployeeCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_editor),
):
    """Create an internal employee contact."""
    email = employee.email.strip().lower()
    existing = db.query(models.Employee).filter(models.Employee.email == email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Employee email already exists")

    db_employee = models.Employee(**employee.model_dump(exclude={"email"}), email=email)
    db.add(db_employee)
    db.add(
        models.AuditLog(
            actor_user_id=current_user.id,
            action="employee.created",
            entity_type="employee",
            message=f"Created employee {email}",
        )
    )
    db.commit()
    db.refresh(db_employee)
    return db_employee


@router.put("/{employee_id}", response_model=schemas.Employee)
def update_employee(
    employee_id: int,
    employee: schemas.EmployeeUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_editor),
):
    """Update an internal employee contact."""
    db_employee = db.query(models.Employee).filter(models.Employee.id == employee_id).first()
    if not db_employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    update_data = employee.model_dump(exclude_unset=True)
    if "email" in update_data and update_data["email"]:
        email = update_data["email"].strip().lower()
        existing = (
            db.query(models.Employee)
            .filter(models.Employee.email == email, models.Employee.id != employee_id)
            .first()
        )
        if existing:
            raise HTTPException(status_code=400, detail="Employee email already exists")
        update_data["email"] = email

    for field, value in update_data.items():
        setattr(db_employee, field, value)

    db.add(
        models.AuditLog(
            actor_user_id=current_user.id,
            action="employee.updated",
            entity_type="employee",
            entity_id=employee_id,
            message=f"Updated employee {db_employee.email}",
        )
    )
    db.commit()
    db.refresh(db_employee)
    return db_employee
