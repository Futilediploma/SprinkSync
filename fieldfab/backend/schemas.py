from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional, Any


# ── Auth ──────────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    company_name: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ── User ──────────────────────────────────────────────────────────────────────

class UserResponse(BaseModel):
    id: int
    email: str
    company_name: Optional[str]
    plan_type: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Projects ──────────────────────────────────────────────────────────────────

class ProjectCreate(BaseModel):
    name: str
    company_name: Optional[str] = None
    street_number: Optional[str] = None
    street_name: Optional[str] = None
    city: Optional[str] = None
    zipcode: Optional[str] = None


class ProjectResponse(BaseModel):
    id: int
    user_id: int
    name: str
    company_name: Optional[str]
    street_number: Optional[str]
    street_name: Optional[str]
    city: Optional[str]
    zipcode: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Pieces ────────────────────────────────────────────────────────────────────

class PieceCreate(BaseModel):
    order_index: int = 0
    qty: int = 1
    feet: str = ""
    inches: str = ""
    pipe_type: str = ""
    pipe_tag: str = ""
    diameter: str = ""
    fittings_end1: str = ""
    fittings_end2: str = ""
    outlets: list[Any] = []


class PieceResponse(BaseModel):
    id: int
    project_id: int
    order_index: int
    qty: int
    feet: str
    inches: str
    pipe_type: str
    pipe_tag: str
    diameter: str
    fittings_end1: str
    fittings_end2: str
    outlets: list[Any]

    model_config = {"from_attributes": True}


# ── Loose Materials ───────────────────────────────────────────────────────────

class LooseMaterialCreate(BaseModel):
    order_index: int = 0
    qty: int = 1
    part: str = ""
    size: str = ""
    description: str = ""
    mat_type: str = ""
    options: list[str] = []
    sizes: list[str] = []


class LooseMaterialResponse(BaseModel):
    id: int
    project_id: int
    order_index: int
    qty: int
    part: str
    size: str
    description: str
    mat_type: str
    options: list[str]
    sizes: list[str]

    model_config = {"from_attributes": True}


# ── Sales Leads ───────────────────────────────────────────────────────────────

class SalesLeadCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    company_name: str = Field(min_length=2, max_length=160)
    phone: Optional[str] = Field(default=None, max_length=40)
    company_size: Optional[str] = Field(default=None, max_length=40)
    message: str = Field(min_length=10, max_length=2000)


class SalesLeadResponse(BaseModel):
    id: int
    full_name: str
    email: str
    company_name: str
    phone: Optional[str]
    company_size: Optional[str]
    message: str
    created_at: datetime

    model_config = {"from_attributes": True}
