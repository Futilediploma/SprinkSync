from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status


TRIAL_DAYS = 15
PRE_TRIAL_PROJECT_LIMIT = 1
PRE_TRIAL_PIPE_QTY_LIMIT = 10


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _as_utc(value: datetime | None) -> datetime | None:
    if value is None:
        return None
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def get_access_state(user, now: datetime | None = None) -> str:
    if user.plan_type == "pro":
        return "pro"

    started_at = _as_utc(user.trial_started_at)
    if started_at is None:
        return "pre_trial"

    current_time = _as_utc(now) or utc_now()
    if current_time < started_at + timedelta(days=TRIAL_DAYS):
        return "trial_active"
    return "trial_expired"


def get_access_summary(user, now: datetime | None = None) -> dict:
    current_time = _as_utc(now) or utc_now()
    started_at = _as_utc(user.trial_started_at)
    expires_at = started_at + timedelta(days=TRIAL_DAYS) if started_at else None
    access_state = get_access_state(user, current_time)

    days_remaining = None
    if access_state == "trial_active" and expires_at:
        seconds_remaining = max(0, (expires_at - current_time).total_seconds())
        days_remaining = max(1, int((seconds_remaining + 86399) // 86400))

    can_use = access_state in {"pre_trial", "trial_active", "pro"}
    return {
        "trial_started_at": started_at,
        "trial_expires_at": expires_at,
        "access_state": access_state,
        "trial_days_remaining": days_remaining,
        "can_mutate": can_use,
        "can_export": can_use,
    }


def require_mutation_access(user) -> str:
    access_state = get_access_state(user)
    if access_state == "trial_expired":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your 15-day FieldFab trial has ended. Upgrade to Pro to make changes.",
        )
    return access_state


def require_export_access(user) -> str:
    access_state = get_access_state(user)
    if access_state == "trial_expired":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your 15-day FieldFab trial has ended. Upgrade to Pro to export.",
        )
    return access_state


def pre_trial_edit_allowed(current_total: int, existing_qty: int, requested_qty: int) -> bool:
    next_total = current_total - max(0, existing_qty) + max(0, requested_qty)
    return next_total <= max(PRE_TRIAL_PIPE_QTY_LIMIT, current_total)
