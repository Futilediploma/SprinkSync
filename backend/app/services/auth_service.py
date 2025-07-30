from datetime import datetime, timedelta
from typing import Optional, Dict, Any, Tuple, List
import secrets
import hashlib
from passlib.context import CryptContext
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from ..models.auth import User, Company, UserInvitation, UserSession
from ..core.config import settings
from ..utils.password_validator import PasswordValidator

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class AuthService:
    
    @staticmethod
    def validate_password_strength(password: str) -> Tuple[bool, List[str]]:
        """Validate password meets security requirements"""
        return PasswordValidator.validate_password(password)
    
    @staticmethod
    def hash_password(password: str) -> str:
        """Hash a password using bcrypt"""
        return pwd_context.hash(password)
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash"""
        return pwd_context.verify(plain_password, hashed_password)
    
    @staticmethod
    def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
        """Create a JWT access token"""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        return encoded_jwt
    
    @staticmethod
    def verify_token(token: str) -> Optional[Dict[str, Any]]:
        """Verify and decode a JWT token"""
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            return payload
        except JWTError:
            return None
    
    @staticmethod
    def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
        """Authenticate a user with email and password"""
        user = db.query(User).filter(User.email == email, User.is_active == True).first()
        if not user:
            return None
        if not AuthService.verify_password(password, user.password_hash):
            return None
        return user
    
    @staticmethod
    def create_company(
        db: Session, 
        name: str, 
        admin_email: str, 
        admin_first_name: str, 
        admin_last_name: str,
        admin_password: str
    ) -> tuple[Company, User]:
        """Create a new company with an admin user"""
        
        # Create company slug from name
        slug = name.lower().replace(' ', '-').replace('_', '-')
        
        # Ensure slug is unique
        counter = 1
        original_slug = slug
        while db.query(Company).filter(Company.slug == slug).first():
            slug = f"{original_slug}-{counter}"
            counter += 1
        
        # Create company
        company = Company(
            name=name,
            slug=slug,
            email=admin_email
        )
        db.add(company)
        db.flush()  # Get the company ID
        
        # Create admin user
        admin_user = User(
            email=admin_email,
            password_hash=AuthService.hash_password(admin_password),
            first_name=admin_first_name,
            last_name=admin_last_name,
            role='company_admin',
            company_id=company.id,
            email_verified=True,  # Auto-verify for admin
            is_active=True
        )
        db.add(admin_user)
        db.commit()
        
        return company, admin_user
    
    @staticmethod
    def create_invitation(
        db: Session,
        email: str,
        company_id: str,
        invited_by_user_id: str,
        role: str,
        expires_in_days: int = 7
    ) -> UserInvitation:
        """Create a user invitation"""
        
        # Generate secure token
        token = secrets.token_urlsafe(32)
        
        # Set expiration
        expires_at = datetime.utcnow() + timedelta(days=expires_in_days)
        
        invitation = UserInvitation(
            email=email,
            company_id=company_id,
            invited_by=invited_by_user_id,
            role=role,
            token=token,
            expires_at=expires_at
        )
        
        db.add(invitation)
        db.commit()
        
        return invitation
    
    @staticmethod
    def accept_invitation(
        db: Session,
        token: str,
        first_name: str,
        last_name: str,
        password: str
    ) -> Optional[User]:
        """Accept a user invitation and create account"""
        
        # Find valid invitation
        invitation = db.query(UserInvitation).filter(
            UserInvitation.token == token,
            UserInvitation.accepted_at.is_(None)
        ).first()
        
        if not invitation or invitation.is_expired:
            return None
        
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == invitation.email).first()
        if existing_user:
            return None
        
        # Create user
        user = User(
            email=invitation.email,
            password_hash=AuthService.hash_password(password),
            first_name=first_name,
            last_name=last_name,
            role=invitation.role,
            company_id=invitation.company_id,
            email_verified=True,
            is_active=True
        )
        
        db.add(user)
        
        # Mark invitation as accepted
        invitation.accepted_at = datetime.utcnow()
        
        db.commit()
        
        return user
    
    @staticmethod
    def create_session(db: Session, user_id: str, token: str) -> UserSession:
        """Create a user session"""
        
        # Hash the token for storage
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        
        # Set expiration (30 days)
        expires_at = datetime.utcnow() + timedelta(days=30)
        
        session = UserSession(
            user_id=user_id,
            token_hash=token_hash,
            expires_at=expires_at
        )
        
        db.add(session)
        db.commit()
        
        return session
    
    @staticmethod
    def get_user_by_token(db: Session, token: str) -> Optional[User]:
        """Get user by session token"""
        
        # Decode JWT to get user info
        payload = AuthService.verify_token(token)
        if not payload:
            return None
        
        user_id = payload.get("sub")
        if not user_id:
            return None
        
        # Get user and verify they're active
        user = db.query(User).filter(
            User.id == user_id,
            User.is_active == True
        ).first()
        
        return user
    
    @staticmethod
    def revoke_session(db: Session, token: str) -> bool:
        """Revoke a user session"""
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        
        session = db.query(UserSession).filter(
            UserSession.token_hash == token_hash
        ).first()
        
        if session:
            db.delete(session)
            db.commit()
            return True
        
        return False
    
    @staticmethod
    def cleanup_expired_sessions(db: Session) -> int:
        """Remove expired sessions"""
        expired_count = db.query(UserSession).filter(
            UserSession.expires_at < datetime.utcnow()
        ).delete()
        
        db.commit()
        return expired_count
