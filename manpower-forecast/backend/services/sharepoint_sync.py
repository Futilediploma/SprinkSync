"""SharePoint Excel auto-import service using rclone."""
import os
import subprocess
import logging
from datetime import datetime, date
from typing import Optional

from sqlalchemy.orm import Session

import models

logger = logging.getLogger(__name__)

# Preserve these user-edited fields during updates — never overwrite them
PRESERVED_FIELDS = {
    "end_date",
    "budgeted_hours",
    "bfpe_sprinkler_headcount",
    "bfpe_vesda_headcount",
    "bfpe_electrical_headcount",
    "manpower_allocated",
    "sub_headcount",
    "notes",
}


def _safe_str(val) -> Optional[str]:
    """Convert a cell value to a stripped string, or None if blank."""
    if val is None:
        return None
    s = str(val).strip()
    return s if s and s.lower() not in ("nan", "none", "") else None


def _safe_int(val) -> Optional[int]:
    """Convert a cell value to int, or None."""
    try:
        if val is None:
            return None
        return int(float(str(val).strip()))
    except (ValueError, TypeError):
        return None


def _safe_float(val) -> Optional[float]:
    """Convert a cell value to float, or None."""
    try:
        if val is None:
            return None
        s = str(val).strip()
        if not s or s.lower() in ("nan", "none", ""):
            return None
        # Strip currency symbols / commas
        s = s.replace("$", "").replace(",", "").strip()
        return float(s)
    except (ValueError, TypeError):
        return None


def _safe_date(val) -> Optional[date]:
    """Convert a cell value to a date, or None."""
    if val is None:
        return None
    if isinstance(val, date):
        return val
    if hasattr(val, "date"):
        return val.date()
    try:
        from dateutil.parser import parse as _parse
        s = str(val).strip()
        if not s or s.lower() in ("nan", "none", ""):
            return None
        return _parse(s).date()
    except Exception:
        return None


def _download_file(remote: str, remote_path: str, local_path: str) -> None:
    """Download the Excel file from rclone remote to local path."""
    local_dir = os.path.dirname(local_path)
    os.makedirs(local_dir, exist_ok=True)

    cmd = [
        "rclone", "copy",
        f"{remote}:{remote_path}",
        local_dir,
        "--no-traverse",
    ]
    logger.info("Running rclone: %s", " ".join(cmd))
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
    if result.returncode != 0:
        raise RuntimeError(
            f"rclone exited with code {result.returncode}: {result.stderr.strip()}"
        )


def _parse_sheet(df, sheet_name: str, min_probability: int) -> list:
    """
    Parse a single tracker sheet DataFrame into a list of project dicts.

    Expected columns (0-indexed):
      A=0 Record ID, B=1 Bid Name, C=2 Contractor/Client, D=3 Local/OOT,
      E=4 Owner, G=6 Stage, H=7 Probability, I=8 Est Value,
      J=9 Square Footage, K=10 On Site Start Date, L=11 Est Manpower,
      M=12 US Citizen, P=15 Notes
    """
    records = []
    for _, row in df.iterrows():
        def col(idx):
            try:
                return row.iloc[idx]
            except IndexError:
                return None

        external_id = _safe_str(col(0))
        if not external_id:
            continue  # Skip rows without a Record ID

        bid_name = _safe_str(col(1))
        if not bid_name:
            continue  # Must have a name

        stage = _safe_str(col(6)) or ""
        stage_upper = stage.upper()
        owner_raw = _safe_str(col(4)) or ""
        notes_raw = _safe_str(col(15)) or ""
        probability_raw = _safe_int(col(7))

        # Determine if row qualifies for import
        is_won = "WON" in stage_upper
        # Check Sold column - the plan says Owner(E) can carry "AWS"; a separate
        # Sold column may also exist. We look for "Yes" in a "Sold" context.
        # Per plan: Sold="Yes" in column E area — check owner_raw
        is_sold = owner_raw.upper() == "YES"

        is_open = "OPEN" in stage_upper
        prob = probability_raw if probability_raw is not None else 0

        if is_won or is_sold:
            status = "active"
        elif is_open and prob >= min_probability:
            status = "prospective"
        else:
            continue  # Does not meet import criteria

        # Owner logic: "AWS" → is_aws=True
        is_aws = "AWS" in owner_raw.upper()

        # Local / Out of Town
        location_raw = _safe_str(col(3)) or ""
        is_out_of_town = "OUT OF TOWN" in location_raw.upper()

        # US Citizen
        us_citizen_raw = _safe_str(col(12)) or ""
        us_citizen_required = "YES" in us_citizen_raw.upper() or us_citizen_raw == "1"

        records.append({
            "external_id": external_id,
            "name": bid_name,
            "customer_name": _safe_str(col(2)),
            "is_out_of_town": is_out_of_town,
            "is_aws": is_aws,
            "status": status,
            "bid_stage": stage,
            "probability": probability_raw,
            "estimated_value": _safe_float(col(8)),
            "square_footage": _safe_float(col(9)),
            "start_date": _safe_date(col(10)),
            "required_manpower": _safe_int(col(11)) or 0,
            "us_citizen_required": us_citizen_required,
            "notes": notes_raw if notes_raw else None,
            "source": "sharepoint",
        })
    return records


def run_sync(
    db: Session,
    trigger: str = "scheduled",
    triggered_by: Optional[str] = None,
) -> models.SyncLog:
    """
    Run a full SharePoint sync cycle.

    Returns the completed SyncLog record.
    """
    from config import settings  # local import to avoid circular deps at module load

    sync_log = models.SyncLog(
        status="running",
        trigger=trigger,
        triggered_by=triggered_by,
    )
    db.add(sync_log)
    db.commit()
    db.refresh(sync_log)

    projects_created = 0
    projects_updated = 0
    projects_skipped = 0
    rows_processed = 0
    error_message = None
    details_lines = []

    try:
        # Validate configuration
        if not settings.sharepoint_file_remote_path:
            raise RuntimeError(
                "sharepoint_file_remote_path is not configured. "
                "Set SHAREPOINT_FILE_REMOTE_PATH in your .env file."
            )

        # Step 1: Download file via rclone
        _download_file(
            settings.rclone_remote,
            settings.sharepoint_file_remote_path,
            settings.sharepoint_local_path,
        )

        if not os.path.exists(settings.sharepoint_local_path):
            raise FileNotFoundError(
                f"Expected file not found after rclone download: {settings.sharepoint_local_path}"
            )

        # Step 2: Parse Excel
        try:
            import pandas as pd
        except ImportError:
            raise RuntimeError(
                "pandas is not installed. Run: pip install pandas openpyxl"
            )

        sheet_names = ["IAD Bid Tracker", "Data Center (Non IAD) Tracker"]
        all_records = []

        for sheet_name in sheet_names:
            try:
                df = pd.read_excel(
                    settings.sharepoint_local_path,
                    sheet_name=sheet_name,
                    header=0,
                    engine="openpyxl",
                )
                records = _parse_sheet(df, sheet_name, settings.sharepoint_min_probability)
                all_records.extend(records)
                details_lines.append(
                    f"Sheet '{sheet_name}': {len(df)} rows read, {len(records)} qualifying records"
                )
                rows_processed += len(df)
            except Exception as sheet_err:
                details_lines.append(f"Sheet '{sheet_name}': ERROR - {sheet_err}")
                logger.warning("Failed to parse sheet '%s': %s", sheet_name, sheet_err)

        # Step 3: Upsert into database
        now = datetime.utcnow()

        for record in all_records:
            external_id = record["external_id"]
            existing = (
                db.query(models.Project)
                .filter(models.Project.external_id == external_id)
                .first()
            )

            if existing:
                # Update SharePoint-sourced fields; preserve user-edited ones
                changed = False
                for field, value in record.items():
                    if field in PRESERVED_FIELDS:
                        continue
                    current = getattr(existing, field, None)
                    if current != value:
                        setattr(existing, field, value)
                        changed = True
                existing.last_synced_at = now
                if changed:
                    projects_updated += 1
                else:
                    projects_skipped += 1
            else:
                new_project = models.Project(
                    **{k: v for k, v in record.items()},
                    last_synced_at=now,
                )
                db.add(new_project)
                projects_created += 1

        db.commit()

        sync_log.status = "success"

    except Exception as exc:
        error_message = str(exc)
        sync_log.status = "error"
        logger.error("SharePoint sync failed: %s", exc, exc_info=True)
        try:
            db.rollback()
        except Exception:
            pass

    sync_log.completed_at = datetime.utcnow()
    sync_log.projects_created = projects_created
    sync_log.projects_updated = projects_updated
    sync_log.projects_skipped = projects_skipped
    sync_log.rows_processed = rows_processed
    sync_log.error_message = error_message
    sync_log.details = "\n".join(details_lines) if details_lines else None

    try:
        db.add(sync_log)
        db.commit()
        db.refresh(sync_log)
    except Exception as commit_err:
        logger.error("Failed to save sync log: %s", commit_err)

    return sync_log
