from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, ConfigDict

# Project Schemas
class ProjectBase(BaseModel):
    # Basic Info
    name: str
    description: Optional[str] = None
    status: Optional[str] = "Planning"
    
    # Job Details
    job_number: Optional[str] = None
    job_type: Optional[str] = None
    job_category: Optional[str] = None
    job_priority: Optional[str] = "Medium"
    
    # Location & Address
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    county: Optional[str] = None
    
    # Client Information
    client_name: Optional[str] = None
    client_contact: Optional[str] = None
    client_phone: Optional[str] = None
    client_email: Optional[str] = None
    billing_address: Optional[str] = None
    
    # Schedule
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    estimated_duration: Optional[int] = None
    critical_milestones: Optional[str] = None
    
    # Financial
    contract_amount: Optional[float] = None
    budget: Optional[float] = None
    estimated_cost: Optional[float] = None
    profit_margin: Optional[float] = None
    payment_terms: Optional[str] = None
    
    # Personnel
    project_manager: Optional[str] = None
    site_supervisor: Optional[str] = None
    foreman: Optional[str] = None
    safety_officer: Optional[str] = None
    
    # Permits & Documentation
    permits_required: Optional[str] = None
    permit_status: Optional[str] = None
    insurance_requirements: Optional[str] = None
    special_requirements: Optional[str] = None
    
    # Safety
    safety_plan_required: Optional[bool] = False
    hazard_analysis: Optional[str] = None
    ppe_requirements: Optional[str] = None

class ProjectCreate(ProjectBase):
    name: str  # Required field

class ProjectUpdate(BaseModel):
    # Make all fields optional for updates
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    job_number: Optional[str] = None
    job_type: Optional[str] = None
    job_category: Optional[str] = None
    job_priority: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    county: Optional[str] = None
    client_name: Optional[str] = None
    client_contact: Optional[str] = None
    client_phone: Optional[str] = None
    client_email: Optional[str] = None
    billing_address: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    estimated_duration: Optional[int] = None
    critical_milestones: Optional[str] = None
    contract_amount: Optional[float] = None
    budget: Optional[float] = None
    estimated_cost: Optional[float] = None
    profit_margin: Optional[float] = None
    payment_terms: Optional[str] = None
    project_manager: Optional[str] = None
    site_supervisor: Optional[str] = None
    foreman: Optional[str] = None
    safety_officer: Optional[str] = None
    permits_required: Optional[str] = None
    permit_status: Optional[str] = None
    insurance_requirements: Optional[str] = None
    special_requirements: Optional[str] = None
    safety_plan_required: Optional[bool] = None
    hazard_analysis: Optional[str] = None
    ppe_requirements: Optional[str] = None

class Project(ProjectBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

# Task Schemas
class TaskBase(BaseModel):
    name: str
    description: Optional[str] = None
    status: str = "not_started"
    priority: str = "medium"
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    duration_days: Optional[int] = None
    assigned_to: Optional[str] = None
    progress: float = 0.0

class TaskCreate(TaskBase):
    project_id: int

class TaskUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    duration_days: Optional[int] = None
    assigned_to: Optional[str] = None
    progress: Optional[float] = None

class Task(TaskBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    project_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

# RFI Schemas
class RFIBase(BaseModel):
    rfi_number: str
    title: str
    description: Optional[str] = None
    status: str = "open"
    priority: str = "medium"
    submitted_by: Optional[str] = None
    assigned_to: Optional[str] = None
    due_date: Optional[datetime] = None

class RFICreate(RFIBase):
    project_id: int

class RFIUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    submitted_by: Optional[str] = None
    assigned_to: Optional[str] = None
    due_date: Optional[datetime] = None

class RFI(RFIBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    project_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

# Change Order Schemas
class ChangeOrderBase(BaseModel):
    co_number: str
    title: str
    description: Optional[str] = None
    status: str = "draft"
    cost_impact: float = 0.0
    time_impact_days: int = 0
    requested_by: Optional[str] = None
    approved_by: Optional[str] = None

class ChangeOrderCreate(ChangeOrderBase):
    project_id: int

class ChangeOrderUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    cost_impact: Optional[float] = None
    time_impact_days: Optional[int] = None
    requested_by: Optional[str] = None
    approved_by: Optional[str] = None

class ChangeOrder(ChangeOrderBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    project_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

# Inspection Schemas
class InspectionBase(BaseModel):
    inspection_type: str
    scheduled_date: Optional[datetime] = None
    completed_date: Optional[datetime] = None
    status: str = "scheduled"
    result: Optional[str] = None
    notes: Optional[str] = None
    inspector: Optional[str] = None

class InspectionCreate(InspectionBase):
    project_id: int

class InspectionUpdate(BaseModel):
    inspection_type: Optional[str] = None
    scheduled_date: Optional[datetime] = None
    completed_date: Optional[datetime] = None
    status: Optional[str] = None
    result: Optional[str] = None
    notes: Optional[str] = None
    inspector: Optional[str] = None

class Inspection(InspectionBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    project_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
