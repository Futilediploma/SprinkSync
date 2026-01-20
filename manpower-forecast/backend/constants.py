"""Application constants."""

# Time constants
HOURS_PER_DAY = 8
WORKING_DAYS_PER_WEEK = 5
DAYS_PER_WEEK = 7

# Authentication
TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

# Project statuses
class ProjectStatus:
    ACTIVE = "active"
    PROSPECTIVE = "prospective"
    COMPLETED = "completed"
    ARCHIVED = "archived"

    ALL = [ACTIVE, PROSPECTIVE, COMPLETED, ARCHIVED]
    SCHEDULABLE = [ACTIVE, PROSPECTIVE]  # Statuses that appear in forecasts


# User roles
class UserRole:
    ADMIN = "admin"
    EDITOR = "editor"
    VIEWER = "viewer"

    ALL = [ADMIN, EDITOR, VIEWER]


# Forecast granularity options
class ForecastGranularity:
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"

    ALL = [DAILY, WEEKLY, MONTHLY]


# Pagination defaults
DEFAULT_PAGE_SIZE = 100
MAX_PAGE_SIZE = 1000
