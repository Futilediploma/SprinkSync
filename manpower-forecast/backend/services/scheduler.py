"""Background scheduler for periodic SharePoint sync and notification delivery."""
import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from config import settings
from database import SessionLocal
from services.sharepoint_sync import run_sync
from services.notification_service import NotificationService

logger = logging.getLogger(__name__)
scheduler = AsyncIOScheduler()


def start_scheduler():
    """Start configured background jobs."""
    if settings.sharepoint_sync_enabled:
        scheduler.add_job(
            scheduled_sync,
            IntervalTrigger(minutes=settings.sharepoint_sync_interval_minutes),
            id="sharepoint_sync",
            replace_existing=True,
        )
        logger.info(
            "SharePoint sync scheduler started (every %d min)",
            settings.sharepoint_sync_interval_minutes,
        )
    else:
        logger.info("SharePoint sync disabled")

    scheduler.add_job(
        process_notification_queue,
        IntervalTrigger(seconds=settings.notification_poll_interval_seconds),
        id="notification_queue",
        replace_existing=True,
    )
    logger.info(
        "Notification scheduler started (every %d sec)",
        settings.notification_poll_interval_seconds,
    )

    if not scheduler.running:
        scheduler.start()


def stop_scheduler():
    """Gracefully stop the scheduler."""
    if scheduler.running:
        scheduler.shutdown()


async def scheduled_sync():
    """Async wrapper that runs sync in a database session."""
    db = SessionLocal()
    try:
        run_sync(db, trigger="scheduled")
    finally:
        db.close()


async def process_notification_queue():
    """Process queued manpower notification emails."""
    db = SessionLocal()
    try:
        processed = NotificationService.process_due_notifications(db)
        if processed:
            logger.info("Processed %d manpower notification(s)", processed)
    finally:
        db.close()
