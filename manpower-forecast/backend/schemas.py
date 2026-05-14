"""Pydantic schemas for request/response validation."""
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import date, datetime
from decimal import Decimal


# ============================================
# Crew Type Schemas
# ============================================

class CrewTypeBase(BaseModel):
    name: str
    description: Optional[str] = None


class CrewTypeCreate(CrewTypeBase):
    pass


class CrewType(CrewTypeBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============================================
# Subcontractor Schemas
# ============================================

class ProjectSubcontractorBase(BaseModel):
    subcontractor_name: str
    labor_type: str  # "sprinkler", "vesda", or "electrical"
    headcount: int = 0  # Number of workers for this trade


class ProjectSubcontractorCreate(ProjectSubcontractorBase):
    pass


class ProjectSubcontractor(ProjectSubcontractorBase):
    id: int
    project_id: int

    class Config:
        from_attributes = True


# ============================================
# Project Schemas
# ============================================

class ProjectBase(BaseModel):
    name: str
    customer_name: Optional[str] = None
    project_number: Optional[str] = None
    status: str = "active"
    notes: Optional[str] = None
    budgeted_hours: Optional[Decimal] = None
    required_manpower: int = 0  # Total number of men needed for the project
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_mechanical: bool = False
    is_electrical: bool = False
    is_vesda: bool = False
    is_aws: bool = False
    is_out_of_town: bool = False
    address: Optional[str] = None
    superintendent_id: Optional[int] = None
    pm_id: Optional[int] = None
    active: bool = True
    manpower_allocated: bool = False
    sub_headcount: Optional[int] = None  # Number of subcontractor workers required on site
    # BFPE labor headcounts
    bfpe_sprinkler_headcount: int = 0
    bfpe_vesda_headcount: int = 0
    bfpe_electrical_headcount: int = 0
    # Tracking fields
    foreman: Optional[str] = None
    po_number: Optional[str] = None
    # SharePoint import fields
    external_id: Optional[str] = None
    source: str = "manual"
    square_footage: Optional[Decimal] = None
    estimated_value: Optional[Decimal] = None
    probability: Optional[int] = None
    bid_stage: Optional[str] = None
    us_citizen_required: bool = False
    last_synced_at: Optional[datetime] = None


class ProjectCreate(ProjectBase):
    subcontractors: Optional[List[ProjectSubcontractorCreate]] = []


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    customer_name: Optional[str] = None
    project_number: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    budgeted_hours: Optional[Decimal] = None
    required_manpower: Optional[int] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_mechanical: Optional[bool] = None
    is_electrical: Optional[bool] = None
    is_vesda: Optional[bool] = None
    is_aws: Optional[bool] = None
    is_out_of_town: Optional[bool] = None
    address: Optional[str] = None
    superintendent_id: Optional[int] = None
    pm_id: Optional[int] = None
    active: Optional[bool] = None
    manpower_allocated: Optional[bool] = None
    sub_headcount: Optional[int] = None
    bfpe_sprinkler_headcount: Optional[int] = None
    bfpe_vesda_headcount: Optional[int] = None
    bfpe_electrical_headcount: Optional[int] = None
    foreman: Optional[str] = None
    po_number: Optional[str] = None
    subcontractors: Optional[List[ProjectSubcontractorCreate]] = None


class Project(ProjectBase):
    id: int
    total_scheduled_hours: Optional[float] = 0.0
    subcontractors: List[ProjectSubcontractor] = []
    created_at: datetime
    updated_at: datetime
    sub_headcount: Optional[int] = None

    class Config:
        from_attributes = True


# ============================================
# Schedule Phase Schemas
# ============================================

class SchedulePhaseBase(BaseModel):
    phase_name: str
    start_date: date
    end_date: date
    estimated_man_hours: Optional[Decimal] = None
    crew_size: Optional[Decimal] = Decimal('2')  # Default: foreman + helper/journeyman
    crew_type_id: Optional[int] = None
    notes: Optional[str] = None
    sort_order: int = 0

    @field_validator('end_date')
    @classmethod
    def validate_end_date(cls, v, info):
        if 'start_date' in info.data and v < info.data['start_date']:
            raise ValueError('end_date must be >= start_date')
        return v


class SchedulePhaseCreate(SchedulePhaseBase):
    pass


class SchedulePhaseUpdate(BaseModel):
    phase_name: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    estimated_man_hours: Optional[Decimal] = None
    crew_size: Optional[Decimal] = None
    crew_type_id: Optional[int] = None
    notes: Optional[str] = None
    sort_order: Optional[int] = None


class SchedulePhase(SchedulePhaseBase):
    id: int
    schedule_id: int
    crew_type: Optional[CrewType] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# ============================================
# Project Schedule Schemas
# ============================================

class ProjectScheduleBase(BaseModel):
    schedule_name: str = "Main Schedule"
    start_date: date
    end_date: date
    is_active: bool = True
    
    @field_validator('end_date')
    @classmethod
    def validate_end_date(cls, v, info):
        if 'start_date' in info.data and v < info.data['start_date']:
            raise ValueError('end_date must be >= start_date')
        return v


class ProjectScheduleCreate(ProjectScheduleBase):
    phases: Optional[List[SchedulePhaseCreate]] = []


class ProjectScheduleUpdate(BaseModel):
    schedule_name: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_active: Optional[bool] = None


class ProjectSchedule(ProjectScheduleBase):
    id: int
    project_id: int
    total_estimated_hours: Optional[Decimal] = None
    phases: List[SchedulePhase] = []
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# ============================================
# Forecast Schemas
# ============================================

class DailyManpower(BaseModel):
    date: date
    man_hours: Decimal
    project_id: int
    phase_id: int
    crew_type_id: Optional[int] = None


class WeeklyForecast(BaseModel):
    week: str  # Format: "2026-W15"
    week_start: date
    man_hours: Decimal
    crew_breakdown: dict[int, Decimal] = {}


class MonthlyForecast(BaseModel):
    month: str  # Format: "2026-03"
    month_name: str
    man_hours: Decimal
    crew_breakdown: dict[int, Decimal] = {}


class ProjectContribution(BaseModel):
    id: int
    name: str
    man_hours: Decimal


class ManpowerForecast(BaseModel):
    start_date: date
    end_date: date
    total_man_hours: Decimal
    project_count: int
    weekly_forecast: List[WeeklyForecast] = []
    monthly_forecast: List[MonthlyForecast] = []
    projects_included: List[ProjectContribution] = []


class ForecastFilters(BaseModel):
    start_date: date
    end_date: date
    project_ids: Optional[List[int]] = None
    crew_type_ids: Optional[List[int]] = None
    granularity: str = "weekly"  # weekly, monthly, daily


# ============================================
# Subcontractor Report Schemas
# ============================================

class SubcontractorPhaseInfo(BaseModel):
    phase_name: str
    start_date: date
    end_date: date
    man_hours: Decimal


class SubcontractorProjectInfo(BaseModel):
    project_id: int
    project_name: str
    project_number: Optional[str] = None
    labor_type: str
    phases: List[SubcontractorPhaseInfo] = []
    total_project_hours: Decimal


class SubcontractorReport(BaseModel):
    subcontractor_name: str
    total_man_hours: Decimal
    projects: List[SubcontractorProjectInfo] = []


# ============================================
# SharePoint Sync Schemas
# ============================================

class SyncLogResponse(BaseModel):
    id: int
    started_at: datetime
    completed_at: Optional[datetime] = None
    status: str
    trigger: str
    triggered_by: Optional[str] = None
    projects_created: int
    projects_updated: int
    projects_skipped: int
    rows_processed: int
    error_message: Optional[str] = None
    details: Optional[str] = None

    class Config:
        from_attributes = True


class SyncStatusResponse(BaseModel):
    configured: bool
    enabled: bool
    last_sync: Optional[SyncLogResponse] = None
    next_sync_in_seconds: Optional[int] = None
    rclone_remote: str
    file_path: str
    sync_interval_minutes: int
    min_probability: int


class SyncTriggerResponse(BaseModel):
    message: str
    sync_log_id: int


# ============================================
# Superintendent Notification Schemas
# ============================================

class EmployeeBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    email: str = Field(..., min_length=3, max_length=255)
    phone: Optional[str] = None
    role: str = Field(..., min_length=1, max_length=50)
    active: bool = True


class EmployeeCreate(EmployeeBase):
    pass


class EmployeeUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    email: Optional[str] = Field(None, min_length=3, max_length=255)
    phone: Optional[str] = None
    role: Optional[str] = Field(None, min_length=1, max_length=50)
    active: Optional[bool] = None


class Employee(EmployeeBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class NotificationResponse(BaseModel):
    id: int
    manpower_request_id: int
    recipient_email: str
    notification_type: str
    provider: str
    status: str
    provider_message_id: Optional[str] = None
    sent_at: Optional[datetime] = None
    error_message: Optional[str] = None
    attempt_count: int = 0
    next_attempt_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ManpowerRequestBase(BaseModel):
    project_id: int
    manpower_required: str = Field(..., min_length=1, max_length=255)
    requested_trades: str = Field(..., min_length=1, max_length=255)
    start_datetime: datetime
    expected_duration: str = Field(..., min_length=1, max_length=255)
    notes: Optional[str] = None
    foreman_id: Optional[int] = None
    superintendent_id: Optional[int] = None
    pm_id: Optional[int] = None
    recipient_ids: Optional[List[int]] = None


class ManpowerRequestCreate(ManpowerRequestBase):
    pass


class ManpowerRequestUpdate(BaseModel):
    project_id: Optional[int] = None
    manpower_required: Optional[str] = Field(None, min_length=1, max_length=255)
    requested_trades: Optional[str] = Field(None, min_length=1, max_length=255)
    start_datetime: Optional[datetime] = None
    expected_duration: Optional[str] = Field(None, min_length=1, max_length=255)
    notes: Optional[str] = None
    foreman_id: Optional[int] = None
    superintendent_id: Optional[int] = None
    pm_id: Optional[int] = None
    recipient_ids: Optional[List[int]] = None


class ManpowerRequestResponse(BaseModel):
    id: int
    project_id: int
    requested_by: Optional[int] = None
    foreman_id: Optional[int] = None
    manpower_required: str
    requested_trades: str
    start_datetime: datetime
    expected_duration: str
    notes: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    project: Optional[Project] = None
    notifications: List[NotificationResponse] = []

    class Config:
        from_attributes = True
