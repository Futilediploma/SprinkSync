"""Migration script to add role column to users table."""
import sqlite3
from config import settings

def migrate():
    """Add role column to users table."""
    # Parse database path from URL
    db_path = settings.database_url.replace("sqlite:///", "")

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # Check if column exists
        cursor.execute("PRAGMA table_info(users)")
        columns = [col[1] for col in cursor.fetchall()]

        if 'role' not in columns:
            # Add the column with default value
            cursor.execute("ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'viewer'")

            # Set first user as admin (if exists)
            cursor.execute("UPDATE users SET role = 'admin' WHERE id = (SELECT MIN(id) FROM users)")

            conn.commit()
            print("Migration complete: Added 'role' column to users table")
            print("First user has been set as admin")
        else:
            print("Column 'role' already exists, skipping migration")

    except Exception as e:
        print(f"Migration failed: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
