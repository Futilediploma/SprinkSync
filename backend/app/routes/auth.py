from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from app.utils.roles import require_roles, ADMIN, PROJECT_MANAGER
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

from ..core.database import get_db
from ..services.auth_service import AuthService
from ..models.auth import User, Company, UserInvitation
from ..core.config import settings
from ..schemas.security import (
    UserLoginSecure,
    CompanyCreateSecure, 
    InviteUserSecure,
    AcceptInvitationSecure
)

router = APIRouter(prefix="/auth", tags=["authentication"])
security = HTTPBearer()

# Pydantic models
class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    first_name: str
    last_name: str
    role: str
    company_id: Optional[str]
    company_name: Optional[str]
    
    class Config:
        from_attributes = True

class CompanyCreate(BaseModel):
    name: str
    admin_email: EmailStr
    admin_first_name: str
    admin_last_name: str
    admin_password: str

class CompanyResponse(BaseModel):
    id: str
    name: str
    slug: str
    email: Optional[str]
    
    class Config:
        from_attributes = True

class InviteUser(BaseModel):
    email: EmailStr
    role: str
    
class AcceptInvitation(BaseModel):
    token: str
    first_name: str
    last_name: str
    password: str

class UserSignup(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    company: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

# Dependency to get current user
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    token = credentials.credentials
    user = AuthService.get_user_by_token(db, token)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user

# Dependency to check if user is company admin
async def get_company_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in ['company_admin', 'super_admin']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user

@router.post("/signup", response_model=TokenResponse)
async def signup(user_data: UserSignup, db: Session = Depends(get_db)):
    """Register a new user with a company"""
    
    # Validate password strength
    is_valid, password_errors = AuthService.validate_password_strength(user_data.password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Password validation failed: {'; '.join(password_errors)}"
        )
    
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    try:
        # Create company and admin user
        company, user = AuthService.create_company(
            db=db,
            name=user_data.company,
            admin_email=user_data.email,
            admin_first_name=user_data.first_name,
            admin_last_name=user_data.last_name,
            admin_password=user_data.password
        )
        
        # Create access token
        access_token = AuthService.create_access_token(
            data={"sub": str(user.id), "email": user.email, "role": user.role}
        )
        
        # Create session
        AuthService.create_session(db, str(user.id), access_token)
        
        user_response = UserResponse(
            id=str(user.id),
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            role=user.role,
            company_id=str(user.company_id),
            company_name=company.name
        )
        
        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            user=user_response
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error creating account: {str(e)}"
        )

@router.post("/login", response_model=TokenResponse)
async def login(user_data: UserLoginSecure, db: Session = Depends(get_db)):
    """Authenticate user and return access token"""
    
    user = AuthService.authenticate_user(db, user_data.email, user_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Create access token
    access_token = AuthService.create_access_token(
        data={"sub": str(user.id), "email": user.email, "role": user.role}
    )
    
    # Create session
    AuthService.create_session(db, str(user.id), access_token)
    
    # Get company name if user belongs to one
    company_name = user.company.name if user.company else None
    
    user_response = UserResponse(
        id=str(user.id),
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        role=user.role,
        company_id=str(user.company_id) if user.company_id else None,
        company_name=company_name
    )
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=user_response
    )

@router.post("/logout")
async def logout(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Logout user and revoke session"""
    token = credentials.credentials
    AuthService.revoke_session(db, token)
    return {"message": "Successfully logged out"}

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    company_name = current_user.company.name if current_user.company else None
    
    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        first_name=current_user.first_name,
        last_name=current_user.last_name,
        role=current_user.role,
        company_id=str(current_user.company_id) if current_user.company_id else None,
        company_name=company_name
    )

@router.post("/companies", response_model=CompanyResponse, dependencies=[Depends(require_roles([ADMIN]))])
async def create_company(company_data: CompanyCreateSecure, db: Session = Depends(get_db)):
    """Create a new company with admin user (Super Admin only in production)"""
    
    # Validate password strength
    is_valid, password_errors = AuthService.validate_password_strength(company_data.admin_password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Password validation failed: {'; '.join(password_errors)}"
        )
    
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == company_data.admin_email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    try:
        company, admin_user = AuthService.create_company(
            db=db,
            name=company_data.name,
            admin_email=company_data.admin_email,
            admin_first_name=company_data.admin_first_name,
            admin_last_name=company_data.admin_last_name,
            admin_password=company_data.admin_password
        )
        
        return CompanyResponse(
            id=str(company.id),
            name=company.name,
            slug=company.slug,
            email=company.email
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error creating company: {str(e)}"
        )

@router.post("/invite", dependencies=[Depends(require_roles([ADMIN]))])
async def invite_user(
    invitation_data: InviteUserSecure,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_company_admin),
    db: Session = Depends(get_db)
):
    """Invite a user to join the company"""
    
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == invitation_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )
    
    # Check if invitation already exists
    existing_invitation = db.query(UserInvitation).filter(
        UserInvitation.email == invitation_data.email,
        UserInvitation.company_id == current_user.company_id,
        UserInvitation.accepted_at.is_(None)
    ).first()
    
    if existing_invitation and not existing_invitation.is_expired:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invitation already sent and still valid"
        )
    
    # Create invitation
    invitation = AuthService.create_invitation(
        db=db,
        email=invitation_data.email,
        company_id=str(current_user.company_id),
        invited_by_user_id=str(current_user.id),
        role=invitation_data.role
    )
    
    # TODO: Send email invitation in background task
    # background_tasks.add_task(send_invitation_email, invitation)
    
    return {
        "message": "Invitation sent successfully",
        "invitation_token": invitation.token,  # In production, don't return this
        "expires_at": invitation.expires_at
    }

@router.post("/accept-invitation", response_model=TokenResponse)
async def accept_invitation(
    invitation_data: AcceptInvitationSecure,
    db: Session = Depends(get_db)
):
    """Accept an invitation and create user account"""
    
    # Validate password strength
    is_valid, password_errors = AuthService.validate_password_strength(invitation_data.password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Password validation failed: {'; '.join(password_errors)}"
        )
    
    user = AuthService.accept_invitation(
        db=db,
        token=invitation_data.token,
        first_name=invitation_data.first_name,
        last_name=invitation_data.last_name,
        password=invitation_data.password
    )
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired invitation token"
        )
    
    # Create access token for new user
    access_token = AuthService.create_access_token(
        data={"sub": str(user.id), "email": user.email, "role": user.role}
    )
    
    # Create session
    AuthService.create_session(db, str(user.id), access_token)
    
    company_name = user.company.name if user.company else None
    
    user_response = UserResponse(
        id=str(user.id),
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        role=user.role,
        company_id=str(user.company_id) if user.company_id else None,
        company_name=company_name
    )
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=user_response
    )

@router.get("/company/users", dependencies=[Depends(require_roles([ADMIN, PROJECT_MANAGER]))])
async def get_company_users(
    current_user: User = Depends(get_company_admin),
    db: Session = Depends(get_db)
):
    """Get all users in the current user's company"""
    
    users = db.query(User).filter(
        User.company_id == current_user.company_id
    ).all()
    
    return [
        {
            "id": str(user.id),
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": user.role,
            "company_id": str(user.company_id),
            "company_name": user.company.name if user.company else None,
            "is_active": user.is_active,
            "created_at": user.created_at.isoformat() if user.created_at else None
        }
        for user in users
    ]

@router.get("/invitations")
async def get_invitations(
    current_user: User = Depends(get_company_admin),
    db: Session = Depends(get_db)
):
    """Get all pending invitations for the company"""
    
    invitations = db.query(UserInvitation).filter(
        UserInvitation.company_id == current_user.company_id
    ).all()
    
    return [
        {
            "id": str(invitation.id),
            "email": invitation.email,
            "role": invitation.role,
            "status": "accepted" if invitation.accepted_at else ("expired" if invitation.is_expired else "pending"),
            "created_at": invitation.created_at.isoformat() if invitation.created_at else None,
            "expires_at": invitation.expires_at.isoformat() if invitation.expires_at else None
        }
        for invitation in invitations
    ]

@router.delete("/users/{user_id}", dependencies=[Depends(require_roles([ADMIN]))])
async def delete_user(
    user_id: str,
    current_user: User = Depends(get_company_admin),
    db: Session = Depends(get_db)
):
    """Delete a user from the company"""
    
    # Get the user to delete
    user_to_delete = db.query(User).filter(
        User.id == user_id,
        User.company_id == current_user.company_id
    ).first()
    
    if not user_to_delete:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Prevent self-deletion
    if user_to_delete.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    # Delete the user
    db.delete(user_to_delete)
    db.commit()
    
    return {"message": "User deleted successfully"}

@router.patch("/users/{user_id}", dependencies=[Depends(require_roles([ADMIN, PROJECT_MANAGER]))])
async def update_user(
    user_id: str,
    user_data: dict,
    current_user: User = Depends(get_company_admin),
    db: Session = Depends(get_db)
):
    """Update user information"""
    
    # Get the user to update
    user_to_update = db.query(User).filter(
        User.id == user_id,
        User.company_id == current_user.company_id
    ).first()
    
    if not user_to_update:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Update allowed fields
    if "is_active" in user_data:
        user_to_update.is_active = user_data["is_active"]
    
    if "role" in user_data:
        user_to_update.role = user_data["role"]
    
    db.commit()
    db.refresh(user_to_update)
    
    return {
        "id": str(user_to_update.id),
        "email": user_to_update.email,
        "first_name": user_to_update.first_name,
        "last_name": user_to_update.last_name,
        "role": user_to_update.role,
        "company_id": str(user_to_update.company_id),
        "company_name": user_to_update.company.name if user_to_update.company else None,
        "is_active": user_to_update.is_active,
        "created_at": user_to_update.created_at.isoformat() if user_to_update.created_at else None
    }

@router.delete("/invitations/{invitation_id}", dependencies=[Depends(require_roles([ADMIN]))])
async def delete_invitation(
    invitation_id: str,
    current_user: User = Depends(get_company_admin),
    db: Session = Depends(get_db)
):
    """Cancel/delete an invitation"""
    
    # Get the invitation to delete
    invitation = db.query(UserInvitation).filter(
        UserInvitation.id == invitation_id,
        UserInvitation.company_id == current_user.company_id
    ).first()
    
    if not invitation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation not found"
        )
    
    # Delete the invitation
    db.delete(invitation)
    db.commit()
    
    return {"message": "Invitation cancelled successfully"}
