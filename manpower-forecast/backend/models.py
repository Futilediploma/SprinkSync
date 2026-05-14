"""SQLAlchemy database models."""
from sqlalchemy import Column, Integer, String, Text, Date, Numeric, Boolean, ForeignKey, DateTime, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class Employee(Base):
    """Internal employee directory used for superintendent/PM/foreman notifications."""
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    phone = Column(String(50), nullable=True)
    role = Column(String(50), nullable=False, index=True)  # superintendent, pm, foreman, office, other
    active = Column(Boolean, default=True, index=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    superintendent_projects = relationship(
        "Project",
        foreign_keys="Project.superintendent_id",
        back_populates="superintendent",
    )
    pm_projects = relationship(
        "Project",
        foreign_keys="Project.pm_id",
        back_populates="pm",
    )
    foreman_manpower_requests = relationship(
        "ManpowerRequest",
        foreign_keys="ManpowerRequest.foreman_id",
        back_populates="foreman",
    )


class Project(Base):
    """Project model."""
    __tablename__ = "projects"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    customer_name = Column(String(255))
    project_number = Column(String(100))
    status = Column(String(50), default="active", index=True)  # active, completed, archived
    notes = Column(Text)
    budgeted_hours = Column(Numeric(10, 2))
    required_manpower = Column(Integer, default=0)  # Total number of men needed for the project
    start_date = Column(Date)
    end_date = Column(Date)
    is_mechanical = Column(Boolean, default=False)
    is_electrical = Column(Boolean, default=False)
    is_vesda = Column(Boolean, default=False)
    is_aws = Column(Boolean, default=False)
    is_out_of_town = Column(Boolean, default=False)
    address = Column(String(500), nullable=True)
    superintendent_id = Column(Integer, ForeignKey("employees.id", ondelete="SET NULL"), nullable=True, index=True)
    pm_id = Column(Integer, ForeignKey("employees.id", ondelete="SET NULL"), nullable=True, index=True)
    active = Column(Boolean, default=True, index=True)
    manpower_allocated = Column(Boolean, default=False)  # True when manpower has been confirmed/covered
    sub_headcount = Column(Integer, default=0)  # Number of subcontractor workers required on site
    # BFPE labor headcounts
    bfpe_sprinkler_headcount = Column(Integer, default=0)
    bfpe_vesda_headcount = Column(Integer, default=0)
    bfpe_electrical_headcount = Column(Integer, default=0)
    # Tracking fields
    foreman = Column(String(255), nullable=True)
    po_number = Column(String(100), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # SharePoint import fields
    external_id = Column(String(50), unique=True, nullable=True, index=True)
    source = Column(String(50), default="manual")
    square_footage = Column(Numeric(10, 2), nullable=True)
    estimated_value = Column(Numeric(15, 2), nullable=True)
    probability = Column(Integer, nullable=True)
    bid_stage = Column(String(100), nullable=True)
    us_citizen_required = Column(Boolean, default=False)
    last_synced_at = Column(DateTime, nullable=True)

    # Relationships
    schedules = relationship("ProjectSchedule", back_populates="project", cascade="all, delete-orphan")
    subcontractors = relationship("ProjectSubcontractor", back_populates="project", cascade="all, delete-orphan")
    superintendent = relationship(
        "Employee",
        foreign_keys=[superintendent_id],
        back_populates="superintendent_projects",
    )
    pm = relationship(
        "Employee",
        foreign_keys=[pm_id],
        back_populates="pm_projects",
    )
    manpower_requests = relationship("ManpowerRequest", back_populates="project", cascade="all, delete-orphan")

    @property
    def total_scheduled_hours(self):
        """Calculate total scheduled hours from active schedule."""
        total = 0.0
        for schedule in self.schedules:
            if schedule.is_active:
                for phase in schedule.phases:
                    if phase.estimated_man_hours:
                        total += float(phase.estimated_man_hours)
                    elif phase.crew_size:
                        # Calculate hours from crew size
                        days = (phase.end_date - phase.start_date).days + 1
                        # Estimate working days (approx 5/7)
                        # For a precise calc we'd need the service logic, but this is a good property approximation
                        # Or better: just use total days * 8 * (5/7) or if we want to be simple:
                        total += float(phase.crew_size) * 8 * days * (5/7)
        return round(total, 2)


class CrewType(Base):
    """Crew type model."""
    __tablename__ = "crew_types"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    description = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    phases = relationship("SchedulePhase", back_populates="crew_type")


class User(Base):
    """User model for authentication."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    full_name = Column(String(255), nullable=True)
    role = Column(String(50), default="viewer")  # admin, editor, viewer
    created_at = Column(DateTime, server_default=func.now())



class ProjectSchedule(Base):
    """Project schedule model."""
    __tablename__ = "project_schedules"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    schedule_name = Column(String(255), default="Main Schedule")
    start_date = Column(Date, nullable=False, index=True)
    end_date = Column(Date, nullable=False, index=True)
    total_estimated_hours = Column(Numeric(10, 2))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    project = relationship("Project", back_populates="schedules")
    phases = relationship("SchedulePhase", back_populates="schedule", cascade="all, delete-orphan")
    
    # Constraints
    __table_args__ = (
        CheckConstraint('end_date >= start_date', name='schedule_date_check'),
    )


class SchedulePhase(Base):
    """Schedule phase model."""
    __tablename__ = "schedule_phases"
    
    id = Column(Integer, primary_key=True, index=True)
    schedule_id = Column(Integer, ForeignKey("project_schedules.id", ondelete="CASCADE"), nullable=False, index=True)
    phase_name = Column(String(255), nullable=False)
    start_date = Column(Date, nullable=False, index=True)
    end_date = Column(Date, nullable=False, index=True)
    
    # Labor input (one or both)
    estimated_man_hours = Column(Numeric(10, 2))
    crew_size = Column(Numeric(5, 2))
    
    # Crew type (optional)
    crew_type_id = Column(Integer, ForeignKey("crew_types.id", ondelete="SET NULL"), index=True)
    
    # Metadata
    notes = Column(Text)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    schedule = relationship("ProjectSchedule", back_populates="phases")
    crew_type = relationship("CrewType", back_populates="phases")
    
    # Constraints
    __table_args__ = (
        CheckConstraint('end_date >= start_date', name='phase_date_check'),
    )


class ProjectSubcontractor(Base):
    """Project subcontractor assignment model."""
    __tablename__ = "project_subcontractors"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    subcontractor_name = Column(String(100), nullable=False)  # e.g., "Dynalectric"
    labor_type = Column(String(20), nullable=False)  # "sprinkler", "vesda", or "electrical"
    headcount = Column(Integer, default=0)  # Number of workers for this trade
    created_at = Column(DateTime, server_default=func.now())

    # Relationships
    project = relationship("Project", back_populates="subcontractors")


class SyncLog(Base):
    """Sync log model for tracking SharePoint import history."""
    __tablename__ = "sync_logs"

    id = Column(Integer, primary_key=True, index=True)
    started_at = Column(DateTime, server_default=func.now())
    completed_at = Column(DateTime, nullable=True)
    status = Column(String(50))  # "success", "error", "running"
    trigger = Column(String(50))  # "manual", "scheduled"
    triggered_by = Column(String(255), nullable=True)
    projects_created = Column(Integer, default=0)
    projects_updated = Column(Integer, default=0)
    projects_skipped = Column(Integer, default=0)
    rows_processed = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    details = Column(Text, nullable=True)


class ManpowerRequest(Base):
    """Internal manpower request that triggers superintendent notifications."""
    __tablename__ = "manpower_requests"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    requested_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    foreman_id = Column(Integer, ForeignKey("employees.id", ondelete="SET NULL"), nullable=True, index=True)
    manpower_required = Column(String(255), nullable=False)
    requested_trades = Column(String(255), nullable=False)
    start_datetime = Column(DateTime, nullable=False, index=True)
    expected_duration = Column(String(255), nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    project = relationship("Project", back_populates="manpower_requests")
    requester = relationship("User", foreign_keys=[requested_by])
    foreman = relationship(
        "Employee",
        foreign_keys=[foreman_id],
        back_populates="foreman_manpower_requests",
    )
    notifications = relationship("Notification", back_populates="manpower_request", cascade="all, delete-orphan")


class Notification(Base):
    """Queued/sent email notification status for a manpower request."""
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    manpower_request_id = Column(Integer, ForeignKey("manpower_requests.id", ondelete="CASCADE"), nullable=False, index=True)
    recipient_email = Column(String(255), nullable=False, index=True)
    notification_type = Column(String(50), nullable=False, default="manpower_request_created")
    provider = Column(String(50), nullable=False, default="postmark")
    status = Column(String(50), nullable=False, default="queued", index=True)  # queued, sent, failed
    provider_message_id = Column(String(255), nullable=True)
    sent_at = Column(DateTime, nullable=True)
    error_message = Column(Text, nullable=True)
    attempt_count = Column(Integer, nullable=False, default=0)
    next_attempt_at = Column(DateTime, nullable=True, index=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    manpower_request = relationship("ManpowerRequest", back_populates="notifications")


class AuditLog(Base):
    """Small internal audit trail for manpower notification actions."""
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    actor_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    action = Column(String(100), nullable=False, index=True)
    entity_type = Column(String(100), nullable=False)
    entity_id = Column(Integer, nullable=True)
    message = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    actor = relationship("User", foreign_keys=[actor_user_id])
