from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from access import get_access_summary, require_export_access, utc_now
from auth import get_current_user
from database import get_db
from models import Project, User
from schemas import ExportAuthorizeRequest, ExportAuthorizeResponse


router = APIRouter(prefix="/exports", tags=["Exports"])


@router.post("/authorize", response_model=ExportAuthorizeResponse)
def authorize_export(
    body: ExportAuthorizeRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    project = db.get(Project, body.project_id)
    if not project or project.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    access_state = require_export_access(current_user)
    if access_state == "pre_trial":
        current_user.trial_started_at = utc_now()
        db.commit()
        db.refresh(current_user)

    summary = get_access_summary(current_user)
    return {"authorized": True, **summary}
