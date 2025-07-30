from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, Float, ForeignKey, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class Project(Base):
    __tablename__ = "projects"
    
    # Basic Info
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    status = Column(String, default="Planning")
    
    # Job Details
    job_number = Column(String, unique=True)
    job_type = Column(String)
    job_category = Column(String)
    job_priority = Column(String, default="Medium")
    
    # Location & Address
    address = Column(String)
    city = Column(String)
    state = Column(String)
    zip_code = Column(String)
    county = Column(String)
    
    # Client Information
    client_name = Column(String)
    client_contact = Column(String)
    client_phone = Column(String)
    client_email = Column(String)
    billing_address = Column(Text)
    
    # Schedule
    start_date = Column(Date)
    end_date = Column(Date)
    estimated_duration = Column(Integer)  # in days
    critical_milestones = Column(Text)
    
    # Financial
    contract_amount = Column(Float)
    budget = Column(Float)
    estimated_cost = Column(Float)
    profit_margin = Column(Float)
    payment_terms = Column(String)
    
    # Personnel
    project_manager = Column(String)
    site_supervisor = Column(String)
    foreman = Column(String)
    safety_officer = Column(String)
    
    # Permits & Documentation
    permits_required = Column(Text)
    permit_status = Column(String)
    insurance_requirements = Column(Text)
    special_requirements = Column(Text)
    
    # Safety
    safety_plan_required = Column(Boolean, default=False)
    hazard_analysis = Column(Text)
    ppe_requirements = Column(Text)
    
    # System fields
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    tasks = relationship("Task", back_populates="project")
    rfis = relationship("RFI", back_populates="project")
    change_orders = relationship("ChangeOrder", back_populates="project")
    inspections = relationship("Inspection", back_populates="project")

class Task(Base):
    __tablename__ = "tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    name = Column(String, nullable=False)
    description = Column(Text)
    status = Column(String, default="not_started")
    priority = Column(String, default="medium")
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    duration_days = Column(Integer)
    assigned_to = Column(String)
    progress = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    project = relationship("Project", back_populates="tasks")

class RFI(Base):
    __tablename__ = "rfis"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    rfi_number = Column(String, unique=True, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text)
    status = Column(String, default="open")
    priority = Column(String, default="medium")
    submitted_by = Column(String)
    assigned_to = Column(String)
    due_date = Column(DateTime)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    project = relationship("Project", back_populates="rfis")

class ChangeOrder(Base):
    __tablename__ = "change_orders"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    co_number = Column(String, unique=True, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text)
    status = Column(String, default="draft")
    cost_impact = Column(Float, default=0.0)
    time_impact_days = Column(Integer, default=0)
    requested_by = Column(String)
    approved_by = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    project = relationship("Project", back_populates="change_orders")

class Inspection(Base):
    __tablename__ = "inspections"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    inspection_type = Column(String, nullable=False)
    scheduled_date = Column(DateTime)
    completed_date = Column(DateTime)
    status = Column(String, default="scheduled")
    result = Column(String)  # passed, failed, conditional
    notes = Column(Text)
    inspector = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    project = relationship("Project", back_populates="inspections")
