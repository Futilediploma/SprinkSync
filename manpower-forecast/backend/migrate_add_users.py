"""
Database migration script for user authentication.

Usage:
    python migrate_add_users.py

This will:
1. Create the users table if it doesn't exist
2. Prompt you to create an admin user (credentials entered interactively)

No credentials are stored in this file.
"""
import logging
import os
import getpass
from database import SessionLocal, engine
import models
from passlib.context import CryptContext

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Password hashing - use bcrypt (same as auth.py)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def migrate_users():
    """Create users table and optionally add admin user."""
    logger.info("Starting user migration...")

    # Create tables
    models.Base.metadata.create_all(bind=engine)
    logger.info("Users table created/verified.")

    db = SessionLocal()
    try:
        # Check if any users exist
        user_count = db.query(models.User).count()

        if user_count == 0:
            print("\n" + "=" * 50)
            print("No users found. Let's create an admin account.")
            print("=" * 50)

            # Get credentials interactively (not stored in code)
            email = input("Admin email: ").strip()
            password = getpass.getpass("Admin password: ")
            confirm = getpass.getpass("Confirm password: ")

            if password != confirm:
                logger.error("Passwords don't match!")
                return

            if len(password) < 8:
                logger.error("Password must be at least 8 characters!")
                return

            # Create admin user
            hashed_password = pwd_context.hash(password)
            admin_user = models.User(
                email=email,
                hashed_password=hashed_password,
                full_name="Admin",
                is_active=True
            )
            db.add(admin_user)
            db.commit()
            logger.info(f"Admin user created: {email}")
            print("\nAdmin account created successfully!")
        else:
            logger.info(f"Found {user_count} existing user(s). No action needed.")

    except Exception as e:
        logger.error(f"Migration failed: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    migrate_users()
