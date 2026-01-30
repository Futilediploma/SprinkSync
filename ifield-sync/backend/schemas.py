from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class MaterialItem(BaseModel):
    """Material line item"""
    quantity: str = ""
    weight: str = ""
    description: str = ""
    unit_price: str = ""
    total: str = ""


class JobCreate(BaseModel):
    """Schema for creating a new job"""
    form_type: str = "service_order"  # "service_order" or "certificate"
    customer_name: str = Field(..., min_length=1)
    customer_address: Optional[str] = ""
    account_number: Optional[str] = ""
    person_to_see: Optional[str] = ""
    terms: Optional[str] = ""


class JobResponse(BaseModel):
    """Schema for job response"""
    id: int
    share_token: str
    form_type: str
    customer_name: str
    customer_address: Optional[str]
    account_number: Optional[str]
    person_to_see: Optional[str]
    terms: Optional[str]
    created_at: datetime
    is_active: bool
    share_link: str

    class Config:
        from_attributes = True


class SubmissionCreate(BaseModel):
    """Schema for creating a submission"""
    share_token: str
    customer_name: str
    customer_address: Optional[str] = ""
    account_number: Optional[str] = ""
    date_of_call: str
    person_to_see: Optional[str] = ""
    terms: Optional[str] = ""
    special_instructions: Optional[str] = ""
    time_in: Optional[str] = ""
    time_out: Optional[str] = ""
    materials: List[MaterialItem] = []
    gc_signature: Optional[str] = ""
    tech_signature: Optional[str] = ""
    subtotal: float = 0.0
    tax: float = 0.0
    total: float = 0.0


class SubmissionResponse(BaseModel):
    """Schema for submission response"""
    id: int
    job_id: int
    share_token: str
    customer_name: str
    date_of_call: str
    submitted_at: datetime
    pdf_filename: Optional[str]
    uploaded_to_projectsight: bool
    emailed: bool

    class Config:
        from_attributes = True


class UploadConfig(BaseModel):
    """Configuration for upload after submission"""
    upload_to_projectsight: bool = False
    send_email: bool = False
    email_to: Optional[str] = None


class PipingItem(BaseModel):
    """Piping information item for certificate"""
    location: str = ""
    pipe_type: str = ""
    material: str = ""
    size: str = ""
    length: str = ""


class CertificateMaterialItem(BaseModel):
    """Material item for certificate"""
    description: str = ""
    quantity: str = ""


class CertificateSubmissionCreate(BaseModel):
    """Schema for creating a certificate submission"""
    share_token: str
    job_name: str
    job_location: Optional[str] = ""
    permit_number: Optional[str] = ""
    ahj: Optional[str] = ""
    contractor_name: str
    contractor_address: Optional[str] = ""
    contractor_license: Optional[str] = ""
    contractor_phone: Optional[str] = ""
    installer_name: str
    installer_license: Optional[str] = ""
    installer_phone: Optional[str] = ""
    system_type: Optional[str] = ""
    occupancy_classification: Optional[str] = ""
    piping_data: List[PipingItem] = []
    test_type: Optional[str] = ""
    test_pressure: Optional[str] = ""
    test_medium: Optional[str] = ""
    test_duration: Optional[str] = ""
    test_results: Optional[str] = ""
    test_date: Optional[str] = ""
    test_notes: Optional[str] = ""
    materials: List[CertificateMaterialItem] = []
    installer_signature: Optional[str] = ""
    contractor_signature: Optional[str] = ""
    inspector_signature: Optional[str] = ""


class CertificateSubmissionResponse(BaseModel):
    """Schema for certificate submission response"""
    id: int
    job_id: int
    share_token: str
    job_name: str
    submitted_at: datetime
    pdf_filename: Optional[str]
    uploaded_to_projectsight: bool
    emailed: bool


    class Config:
        from_attributes = True


# ============================================================================
# MANPOWER FORECAST MODELS
# ============================================================================

class ProjectCreate(BaseModel):
    job_number: str
    job_name: str
    designer: Optional[str] = None
    superintendent: Optional[str] = None
    total_labor_hours: int = 0
    labor_budget: float = 0.0

class ProjectUpdate(BaseModel):
    job_number: Optional[str] = None
    job_name: Optional[str] = None
    designer: Optional[str] = None
    superintendent: Optional[str] = None
    total_labor_hours: Optional[int] = None
    labor_budget: Optional[float] = None

class ProjectResponse(BaseModel):
    id: int
    job_number: str
    job_name: str
    designer: Optional[str]
    superintendent: Optional[str]
    total_labor_hours: int
    labor_budget: float
    created_at: datetime

    class Config:
        from_attributes = True

class ForecastCreate(BaseModel):
    project_id: int
    hours_completed: int
    start_month: str  # YYYY-MM
    end_month: str    # YYYY-MM

class MonthlyAllocationResponse(BaseModel):
    month: str
    forecast_hours: float

    class Config:
        from_attributes = True

class ForecastResponse(BaseModel):
    id: int
    project_id: int
    hours_completed: int
    start_month: str
    end_month: str
    remaining_hours: float
    allocations: List[MonthlyAllocationResponse] = []

    class Config:
        from_attributes = True

class ManpowerSummary(BaseModel):
    month: str
    total_hours: float

