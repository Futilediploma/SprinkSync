from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text, Integer, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .construction import Base  # Import Base from construction models
import uuid

class Company(Base):
    __tablename__ = "companies"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    slug = Column(String(100), unique=True, nullable=False)
    address = Column(Text)
    phone = Column(String(20))
    email = Column(String(255))
    logo_url = Column(String(500))
    subscription_plan = Column(String(50), default='basic')
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    users = relationship("User", back_populates="company")
    invitations = relationship("UserInvitation", back_populates="company")

class User(Base):
    __tablename__ = "users"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    role = Column(String(50), nullable=False)  # super_admin, company_admin, project_manager, user
    company_id = Column(String(36), ForeignKey("companies.id"))
    is_active = Column(Boolean, default=True)
    email_verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    company = relationship("Company", back_populates="users")
    sessions = relationship("UserSession", back_populates="user")
    sent_invitations = relationship("UserInvitation", back_populates="invited_by_user")
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"
    
    def has_permission(self, permission: str) -> bool:
        """Check if user has specific permission based on role"""
        role_permissions = {
            'super_admin': ['*'],  # All permissions
            'company_admin': [
                'manage_users', 'manage_projects', 'manage_company',
                'view_reports', 'manage_finances'
            ],
            'project_manager': [
                'manage_projects', 'view_reports', 'manage_change_orders'
            ],
            'user': [
                'view_projects', 'create_reports', 'view_change_orders'
            ]
        }
        
        user_permissions = role_permissions.get(self.role, [])
        return '*' in user_permissions or permission in user_permissions

class UserInvitation(Base):
    __tablename__ = "user_invitations"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), nullable=False)
    company_id = Column(String(36), ForeignKey("companies.id"), nullable=False)
    invited_by = Column(String(36), ForeignKey("users.id"), nullable=False)
    role = Column(String(50), nullable=False)
    token = Column(String(255), unique=True, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    accepted_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    company = relationship("Company", back_populates="invitations")
    invited_by_user = relationship("User", back_populates="sent_invitations")
    
    @property
    def is_expired(self):
        from datetime import datetime
        return datetime.utcnow() > self.expires_at
    
    @property
    def is_accepted(self):
        return self.accepted_at is not None

class UserSession(Base):
    __tablename__ = "user_sessions"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    token_hash = Column(String(255), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_used_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="sessions")
