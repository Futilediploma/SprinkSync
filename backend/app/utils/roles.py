# roles.py
from fastapi import HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from typing import List
from starlette.requests import Request
import os

# Role constants
ADMIN = "admin"
PROJECT_MANAGER = "project_manager"
DESIGN_CREDENTIAL = "design_credential"
FIELD_CREDENTIAL = "field_credential"

# List of all roles
ALL_ROLES = [ADMIN, PROJECT_MANAGER, DESIGN_CREDENTIAL, FIELD_CREDENTIAL]

# OAuth2 scheme (adjust tokenUrl as needed)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# Secret key and algorithm (should match your main settings)
SECRET_KEY = os.getenv("SECRET_KEY", "R3hWhaG3wVjQzPGTGvjS-HTqqBCVjgPeAhNe4Gkbjto")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

# Dependency to get current user and check role

def require_roles(allowed_roles: List[str]):
    def role_checker(token: str = Depends(oauth2_scheme)):
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            user_role = payload.get("role")
            if user_role not in allowed_roles:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Insufficient privileges"
                )
            return payload
        except JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials"
            )
    return role_checker
