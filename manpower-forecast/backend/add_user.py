"""
Simple script to add a user to the database.

Usage:
    python add_user.py

You will be prompted for email, password, and role interactively.
"""
import getpass
import bcrypt
from database import SessionLocal, engine
import models

# Create tables if they don't exist
models.Base.metadata.create_all(bind=engine)


def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    return bcrypt.hashpw(
        password.encode('utf-8'),
        bcrypt.gensalt()
    ).decode('utf-8')


def add_user():
    """Add a new user to the database."""
    print("\n" + "=" * 50)
    print("Add New User")
    print("=" * 50)

    # Get user info
    email = input("Email: ").strip()
    if not email:
        print("Error: Email is required!")
        return

    full_name = input("Full name (optional, press Enter to skip): ").strip() or None

    print("\nRoles: admin, editor, viewer")
    role = input("Role [viewer]: ").strip().lower() or "viewer"
    if role not in ["admin", "editor", "viewer"]:
        print("Error: Invalid role. Must be admin, editor, or viewer.")
        return

    password = getpass.getpass("Password: ")
    if len(password) < 6:
        print("Error: Password must be at least 6 characters!")
        return

    confirm = getpass.getpass("Confirm password: ")
    if password != confirm:
        print("Error: Passwords don't match!")
        return

    # Create user
    db = SessionLocal()
    try:
        # Check if email already exists
        existing = db.query(models.User).filter(models.User.email == email).first()
        if existing:
            print(f"Error: User with email '{email}' already exists!")
            return

        # Create new user
        new_user = models.User(
            email=email,
            hashed_password=hash_password(password),
            full_name=full_name,
            role=role,
            is_active=True
        )
        db.add(new_user)
        db.commit()
        print(f"\nUser '{email}' created successfully with role '{role}'!")

    except Exception as e:
        print(f"Error creating user: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    add_user()
