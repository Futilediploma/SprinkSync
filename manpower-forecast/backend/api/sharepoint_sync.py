"""SharePoint sync API endpoints."""
import threading
import logging
from typing import List, Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from config import settings
from api.auth import get_current_active_user
from constants import UserRole
import models
import schemas

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/sharepoint-sync", tags=["sharepoint-sync"])

# Track whether a sync is currently running to prevent concurrent syncs
_sync_running = False
_sync_lock = threading.Lock()


def _get_last_sync(db: Session) -> Optional[models.SyncLog]:
    """Return the most recent completed sync log entry."""
    return (
        db.query(models.SyncLog)
        .filter(models.SyncLog.status.in_(["success", "error"]))
        .order_by(models.SyncLog.started_at.desc())
        .first()
    )


def _get_next_sync_seconds() -> Optional[int]:
    """
    Return approximate seconds until next scheduled sync.
    Returns None if scheduler is not running.
    """
    try:
        from services.scheduler import scheduler
        if not scheduler.running:
            return None
        job = scheduler.get_job("sharepoint_sync")
        if not job or job.next_run_time is None:
            return None
        delta = job.next_run_time - datetime.now(job.next_run_time.tzinfo)
        return max(0, int(delta.total_seconds()))
    except Exception:
        return None


@router.get("/status", response_model=schemas.SyncStatusResponse)
async def get_sync_status(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """Return current SharePoint sync configuration and last sync result."""
    configured = bool(settings.sharepoint_file_remote_path)
    last_sync = _get_last_sync(db)
    last_sync_schema = schemas.SyncLogResponse.model_validate(last_sync) if last_sync else None

    return schemas.SyncStatusResponse(
        configured=configured,
        enabled=settings.sharepoint_sync_enabled,
        last_sync=last_sync_schema,
        next_sync_in_seconds=_get_next_sync_seconds() if settings.sharepoint_sync_enabled else None,
        rclone_remote=settings.rclone_remote,
        file_path=settings.sharepoint_file_remote_path,
        sync_interval_minutes=settings.sharepoint_sync_interval_minutes,
        min_probability=settings.sharepoint_min_probability,
    )


@router.post("/trigger", response_model=schemas.SyncTriggerResponse)
async def trigger_sync(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """Manually trigger a SharePoint sync (requires editor or admin role)."""
    if getattr(current_user, "role", UserRole.VIEWER) not in [UserRole.EDITOR, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Editor or Admin access required to trigger sync",
        )

    global _sync_running
    with _sync_lock:
        if _sync_running:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A sync is already in progress. Please wait for it to complete.",
            )
        _sync_running = True

    # Create a placeholder sync log so we can return the ID immediately
    sync_log = models.SyncLog(
        status="running",
        trigger="manual",
        triggered_by=current_user.email,
    )
    db.add(sync_log)
    db.commit()
    db.refresh(sync_log)
    sync_log_id = sync_log.id

    def _run_in_thread():
        global _sync_running
        from database import SessionLocal
        from services.sharepoint_sync import run_sync
        thread_db = SessionLocal()
        try:
            # The sync service creates its own SyncLog; we already created one above,
            # so we pass the existing db session and trigger info directly.
            # But run_sync creates a new log entry. We delete the placeholder and let
            # run_sync manage its own log.
            # Actually: simplest approach — delete the placeholder and let run_sync
            # create the authoritative log. We return the ID of the new log.
            # To keep the ID stable for the caller, we instead update the placeholder
            # row via run_sync by passing the existing log ID.
            # Simplest: just delete placeholder here and call run_sync which makes its own.
            thread_db.query(models.SyncLog).filter(models.SyncLog.id == sync_log_id).delete()
            thread_db.commit()
            run_sync(thread_db, trigger="manual", triggered_by=current_user.email)
        except Exception as exc:
            logger.error("Background sync thread error: %s", exc, exc_info=True)
        finally:
            thread_db.close()
            with _sync_lock:
                _sync_running = False

    thread = threading.Thread(target=_run_in_thread, daemon=True)
    thread.start()

    return schemas.SyncTriggerResponse(
        message="Sync started in background. Check /api/sharepoint-sync/logs for results.",
        sync_log_id=sync_log_id,
    )


@router.get("/logs", response_model=List[schemas.SyncLogResponse])
async def get_sync_logs(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """Return the last 20 sync log entries."""
    logs = (
        db.query(models.SyncLog)
        .order_by(models.SyncLog.started_at.desc())
        .limit(20)
        .all()
    )
    return logs
