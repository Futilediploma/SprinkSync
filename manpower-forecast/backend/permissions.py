"""Role-based access control (RBAC) permissions."""
from fastapi import Depends, HTTPException, status
import models
from api.auth import get_current_active_user
from constants import UserRole


# Role hierarchy: admin > editor > viewer
ROLE_HIERARCHY = {
    UserRole.ADMIN: 3,
    UserRole.EDITOR: 2,
    UserRole.VIEWER: 1
}


def get_role_level(role: str) -> int:
    """Get the numeric level for a role."""
    return ROLE_HIERARCHY.get(role, 0)


def require_role(minimum_role: str):
    """
    Dependency that requires a minimum role level.

    Usage:
        @router.post("/", dependencies=[Depends(require_role("editor"))])
        def create_something(...):
            ...
    """
    async def role_checker(
        current_user: models.User = Depends(get_current_active_user)
    ) -> models.User:
        user_role = getattr(current_user, 'role', UserRole.VIEWER) or UserRole.VIEWER
        user_level = get_role_level(user_role)
        required_level = get_role_level(minimum_role)

        if user_level < required_level:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required role: {minimum_role}"
            )
        return current_user

    return role_checker


# Convenience dependencies
def require_admin(current_user: models.User = Depends(get_current_active_user)) -> models.User:
    """Require admin role."""
    user_role = getattr(current_user, 'role', UserRole.VIEWER) or UserRole.VIEWER
    if user_role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


def require_editor(current_user: models.User = Depends(get_current_active_user)) -> models.User:
    """Require editor or admin role."""
    user_role = getattr(current_user, 'role', UserRole.VIEWER) or UserRole.VIEWER
    if get_role_level(user_role) < get_role_level(UserRole.EDITOR):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Editor access required"
        )
    return current_user


def require_viewer(current_user: models.User = Depends(get_current_active_user)) -> models.User:
    """Require at least viewer role (any authenticated user)."""
    return current_user
