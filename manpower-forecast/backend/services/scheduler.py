"""Background scheduler for periodic SharePoint sync."""
import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from config import settings
from database import SessionLocal
from services.sharepoint_sync import run_sync

logger = logging.getLogger(__name__)
scheduler = AsyncIOScheduler()


def start_scheduler():
    """Start the background scheduler if SharePoint sync is enabled."""
    if not settings.sharepoint_sync_enabled:
        logger.info("SharePoint sync disabled, scheduler not started")
        return
    scheduler.add_job(
        scheduled_sync,
        IntervalTrigger(minutes=settings.sharepoint_sync_interval_minutes),
        id="sharepoint_sync",
        replace_existing=True,
    )
    scheduler.start()
    logger.info(
        "SharePoint sync scheduler started (every %d min)",
        settings.sharepoint_sync_interval_minutes,
    )


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
