"""Simple script to reset a user's password."""
from database import SessionLocal
import models
from api.auth import get_password_hash

def reset_password():
    db = SessionLocal()

    # List all users
    users = db.query(models.User).all()
    if not users:
        print("No users found in database.")
        db.close()
        return

    print("\nExisting users:")
    for u in users:
        print(f"  - {u.email} (role: {getattr(u, 'role', 'no role')})")

    # Get email
    email = input("\nEnter email of user to reset (or press Enter for first user): ").strip()

    if email:
        user = db.query(models.User).filter(models.User.email == email).first()
    else:
        user = users[0]

    if not user:
        print(f"User with email '{email}' not found.")
        db.close()
        return

    # Get new password
    new_password = input(f"Enter new password for {user.email}: ").strip()

    if not new_password:
        print("Password cannot be empty.")
        db.close()
        return

    # Update password
    user.hashed_password = get_password_hash(new_password)
    db.commit()
    print(f"\nPassword updated successfully for {user.email}")

    db.close()

if __name__ == "__main__":
    reset_password()
