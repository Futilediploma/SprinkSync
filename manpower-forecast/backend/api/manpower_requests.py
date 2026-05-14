"""Manpower request endpoints with simple superintendent notification queueing."""
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

import models
import schemas
from database import get_db
from permissions import require_editor, require_viewer
from services.notification_service import NotificationService, write_audit_log


router = APIRouter(prefix="/api/manpower-requests", tags=["manpower-requests"])


@router.get("", response_model=List[schemas.ManpowerRequestResponse], include_in_schema=False)
@router.get("/", response_model=List[schemas.ManpowerRequestResponse])
def list_manpower_requests(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_viewer),
):
    """List manpower requests for the office notification screen."""
    return (
        db.query(models.ManpowerRequest)
        .options(
            joinedload(models.ManpowerRequest.project),
            joinedload(models.ManpowerRequest.notifications),
        )
        .order_by(models.ManpowerRequest.created_at.desc())
        .limit(250)
        .all()
    )


@router.post("", response_model=schemas.ManpowerRequestResponse, include_in_schema=False)
@router.post("/", response_model=schemas.ManpowerRequestResponse)
def create_manpower_request(
    payload: schemas.ManpowerRequestCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_editor),
):
    """Create a manpower request and queue internal notification emails."""
    project = db.query(models.Project).filter(models.Project.id == payload.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    _apply_project_recipients(db, project, payload.superintendent_id, payload.pm_id)
    _validate_employee(db, payload.foreman_id, "Foreman")
    _require_notification_recipient(project, payload.foreman_id)

    manpower_request = models.ManpowerRequest(
        project_id=payload.project_id,
        requested_by=current_user.id,
        foreman_id=payload.foreman_id,
        manpower_required=payload.manpower_required,
        requested_trades=payload.requested_trades,
        start_datetime=payload.start_datetime,
        expected_duration=payload.expected_duration,
        notes=payload.notes,
    )
    db.add(manpower_request)
    db.flush()
    write_audit_log(
        db,
        action="manpower_request.created",
        entity_type="manpower_request",
        entity_id=manpower_request.id,
        actor_user_id=current_user.id,
        message=f"Created manpower request for project {project.name}",
    )
    NotificationService.enqueue_manpower_notifications(
        db,
        manpower_request,
        notification_type="manpower_request_created",
        actor_user_id=current_user.id,
    )
    db.commit()
    return _get_request_or_404(db, manpower_request.id)


@router.put("/{manpower_request_id}", response_model=schemas.ManpowerRequestResponse)
def update_manpower_request(
    manpower_request_id: int,
    payload: schemas.ManpowerRequestUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_editor),
):
    """Update a manpower request and queue update notification emails."""
    manpower_request = _get_request_or_404(db, manpower_request_id)
    update_data = payload.model_dump(exclude_unset=True)

    project_id = update_data.get("project_id", manpower_request.project_id)
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if "superintendent_id" in update_data or "pm_id" in update_data:
        _apply_project_recipients(
            db,
            project,
            update_data.get("superintendent_id", project.superintendent_id),
            update_data.get("pm_id", project.pm_id),
        )

    if "foreman_id" in update_data:
        _validate_employee(db, update_data["foreman_id"], "Foreman")
    _require_notification_recipient(
        project,
        update_data.get("foreman_id", manpower_request.foreman_id),
    )

    for field in [
        "project_id",
        "foreman_id",
        "manpower_required",
        "requested_trades",
        "start_datetime",
        "expected_duration",
        "notes",
    ]:
        if field in update_data:
            setattr(manpower_request, field, update_data[field])

    db.flush()
    write_audit_log(
        db,
        action="manpower_request.updated",
        entity_type="manpower_request",
        entity_id=manpower_request.id,
        actor_user_id=current_user.id,
        message=f"Updated manpower request for project {project.name}",
    )
    NotificationService.enqueue_manpower_notifications(
        db,
        manpower_request,
        notification_type="manpower_request_updated",
        actor_user_id=current_user.id,
    )
    db.commit()
    return _get_request_or_404(db, manpower_request.id)


@router.get("/{manpower_request_id}/notifications", response_model=List[schemas.NotificationResponse])
def list_manpower_request_notifications(
    manpower_request_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_viewer),
):
    """List notification history for one manpower request."""
    request_exists = db.query(models.ManpowerRequest.id).filter(models.ManpowerRequest.id == manpower_request_id).first()
    if not request_exists:
        raise HTTPException(status_code=404, detail="Manpower request not found")

    return (
        db.query(models.Notification)
        .filter(models.Notification.manpower_request_id == manpower_request_id)
        .order_by(models.Notification.created_at.desc())
        .all()
    )


def _get_request_or_404(db: Session, manpower_request_id: int) -> models.ManpowerRequest:
    manpower_request = (
        db.query(models.ManpowerRequest)
        .options(
            joinedload(models.ManpowerRequest.project),
            joinedload(models.ManpowerRequest.notifications),
            joinedload(models.ManpowerRequest.foreman),
        )
        .filter(models.ManpowerRequest.id == manpower_request_id)
        .first()
    )
    if not manpower_request:
        raise HTTPException(status_code=404, detail="Manpower request not found")
    return manpower_request


def _apply_project_recipients(
    db: Session,
    project: models.Project,
    superintendent_id: int | None,
    pm_id: int | None,
) -> None:
    _validate_employee(db, superintendent_id, "Superintendent")
    _validate_employee(db, pm_id, "PM")
    project.superintendent_id = superintendent_id
    project.pm_id = pm_id


def _validate_employee(db: Session, employee_id: int | None, label: str) -> None:
    if employee_id is None:
        return
    employee = db.query(models.Employee).filter(models.Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail=f"{label} not found")
    if not employee.active:
        raise HTTPException(status_code=400, detail=f"{label} is inactive")


def _require_notification_recipient(project: models.Project, foreman_id: int | None) -> None:
    if project.superintendent_id or project.pm_id or foreman_id:
        return
    raise HTTPException(
        status_code=400,
        detail="Select at least one notification recipient: superintendent, PM, or foreman",
    )
