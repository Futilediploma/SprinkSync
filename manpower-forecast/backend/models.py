"""SQLAlchemy database models."""
from sqlalchemy import Column, Integer, String, Text, Date, Numeric, Boolean, ForeignKey, DateTime, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


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
    start_date = Column(Date)
    end_date = Column(Date)
    is_mechanical = Column(Boolean, default=False)
    is_electrical = Column(Boolean, default=False)
    is_vesda = Column(Boolean, default=False)
    is_aws = Column(Boolean, default=False)
    is_out_of_town = Column(Boolean, default=False)
    sub_headcount = Column(Integer, default=0)  # Number of subcontractor workers required on site
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    schedules = relationship("ProjectSchedule", back_populates="project", cascade="all, delete-orphan")
    subcontractors = relationship("ProjectSubcontractor", back_populates="project", cascade="all, delete-orphan")

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
