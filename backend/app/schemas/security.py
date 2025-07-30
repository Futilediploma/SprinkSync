from pydantic import BaseModel, EmailStr, validator, Field
from typing import Optional, List
import re
from datetime import datetime

class SecureBaseModel(BaseModel):
    """Base model with common security validations"""
    
    @validator('*', pre=True)
    def strip_whitespace(cls, v):
        """Strip whitespace from string fields"""
        if isinstance(v, str):
            return v.strip()
        return v
    
    @validator('*')
    def prevent_xss(cls, v):
        """Basic XSS prevention by checking for script tags"""
        if isinstance(v, str):
            # Check for basic XSS patterns
            xss_patterns = [
                r'<script.*?>.*?</script>',
                r'javascript:',
                r'on\w+\s*=',
                r'<iframe.*?>.*?</iframe>',
                r'<object.*?>.*?</object>',
                r'<embed.*?>.*?</embed>',
            ]
            
            for pattern in xss_patterns:
                if re.search(pattern, v, re.IGNORECASE):
                    raise ValueError("Input contains potentially malicious content")
        return v

class UserLoginSecure(SecureBaseModel):
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=1, max_length=128, description="User password")

class CompanyCreateSecure(SecureBaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Company name")
    admin_email: EmailStr = Field(..., description="Admin email address")
    admin_first_name: str = Field(..., min_length=1, max_length=50, description="Admin first name")
    admin_last_name: str = Field(..., min_length=1, max_length=50, description="Admin last name")
    admin_password: str = Field(..., min_length=8, max_length=128, description="Admin password")
    
    @validator('name')
    def validate_company_name(cls, v):
        """Validate company name"""
        if not re.match(r'^[a-zA-Z0-9\s\-\.\&]+$', v):
            raise ValueError("Company name contains invalid characters")
        return v
    
    @validator('admin_first_name', 'admin_last_name')
    def validate_names(cls, v):
        """Validate person names"""
        if not re.match(r'^[a-zA-Z\s\-\'\.]+$', v):
            raise ValueError("Name contains invalid characters")
        return v

class InviteUserSecure(SecureBaseModel):
    email: EmailStr = Field(..., description="User email to invite")
    role: str = Field(..., description="User role")
    first_name: Optional[str] = Field(None, min_length=1, max_length=50, description="First name")
    last_name: Optional[str] = Field(None, min_length=1, max_length=50, description="Last name")
    
    @validator('role')
    def validate_role(cls, v):
        """Validate user role"""
        allowed_roles = ['admin', 'project_manager', 'design_credential', 'field_credential']
        if v not in allowed_roles:
            raise ValueError(f"Role must be one of: {', '.join(allowed_roles)}")
        return v
    
    @validator('first_name', 'last_name')
    def validate_names(cls, v):
        """Validate person names"""
        if v and not re.match(r'^[a-zA-Z\s\-\'\.]+$', v):
            raise ValueError("Name contains invalid characters")
        return v

class AcceptInvitationSecure(SecureBaseModel):
    token: str = Field(..., min_length=32, max_length=64, description="Invitation token")
    first_name: str = Field(..., min_length=1, max_length=50, description="First name")
    last_name: str = Field(..., min_length=1, max_length=50, description="Last name")
    password: str = Field(..., min_length=8, max_length=128, description="Password")
    
    @validator('token')
    def validate_token(cls, v):
        """Validate invitation token format"""
        if not re.match(r'^[a-zA-Z0-9_-]+$', v):
            raise ValueError("Invalid token format")
        return v
    
    @validator('first_name', 'last_name')
    def validate_names(cls, v):
        """Validate person names"""
        if not re.match(r'^[a-zA-Z\s\-\'\.]+$', v):
            raise ValueError("Name contains invalid characters")
        return v

class ProjectCreateSecure(SecureBaseModel):
    name: str = Field(..., min_length=2, max_length=200, description="Project name")
    description: Optional[str] = Field(None, max_length=2000, description="Project description")
    location: Optional[str] = Field(None, max_length=200, description="Project location")
    budget: Optional[float] = Field(None, ge=0, le=999999999.99, description="Project budget")
    start_date: Optional[str] = Field(None, description="Project start date (YYYY-MM-DD)")
    end_date: Optional[str] = Field(None, description="Project end date (YYYY-MM-DD)")
    status: str = Field("Planning", description="Project status")
    
    @validator('name')
    def validate_project_name(cls, v):
        """Validate project name"""
        if not re.match(r'^[a-zA-Z0-9\s\-\.\&\(\)]+$', v):
            raise ValueError("Project name contains invalid characters")
        return v
    
    @validator('location')
    def validate_location(cls, v):
        """Validate location"""
        if v and not re.match(r'^[a-zA-Z0-9\s\-\.\,\&\(\)]+$', v):
            raise ValueError("Location contains invalid characters")
        return v
    
    @validator('start_date', 'end_date')
    def validate_dates(cls, v):
        """Validate date format"""
        if v:
            try:
                datetime.strptime(v, '%Y-%m-%d')
            except ValueError:
                raise ValueError("Date must be in YYYY-MM-DD format")
        return v
    
    @validator('status')
    def validate_status(cls, v):
        """Validate project status"""
        allowed_statuses = ['Planning', 'In Progress', 'Completed', 'On Hold', 'Cancelled']
        if v not in allowed_statuses:
            raise ValueError(f"Status must be one of: {', '.join(allowed_statuses)}")
        return v

class FileUploadSecure(SecureBaseModel):
    filename: str = Field(..., min_length=1, max_length=255, description="File name")
    content_type: str = Field(..., description="File content type")
    
    @validator('filename')
    def validate_filename(cls, v):
        """Validate filename for security"""
        # Remove path traversal attempts
        if '..' in v or '/' in v or '\\' in v:
            raise ValueError("Filename contains invalid path characters")
        
        # Check for valid filename characters
        if not re.match(r'^[a-zA-Z0-9\s\-\._]+$', v):
            raise ValueError("Filename contains invalid characters")
        
        # Check file extension
        allowed_extensions = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.txt', '.xlsx', '.csv']
        if not any(v.lower().endswith(ext) for ext in allowed_extensions):
            raise ValueError(f"File type not allowed. Allowed types: {', '.join(allowed_extensions)}")
        
        return v
    
    @validator('content_type')
    def validate_content_type(cls, v):
        """Validate content type"""
        allowed_types = [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/csv'
        ]
        
        if v not in allowed_types:
            raise ValueError(f"Content type not allowed: {v}")
        
        return v

# Export commonly used secure models
__all__ = [
    'SecureBaseModel',
    'UserLoginSecure',
    'CompanyCreateSecure', 
    'InviteUserSecure',
    'AcceptInvitationSecure',
    'ProjectCreateSecure',
    'FileUploadSecure'
]
