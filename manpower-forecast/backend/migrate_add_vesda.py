"""Migration script to add is_vesda column to projects table."""
import sqlite3
import os

def migrate():
    """Add is_vesda column to projects table if it doesn't exist."""
    db_path = os.path.join(os.path.dirname(__file__), 'manpower_forecast.db')

    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Check if column exists
    cursor.execute("PRAGMA table_info(projects)")
    columns = [col[1] for col in cursor.fetchall()]

    if 'is_vesda' in columns:
        print("Column 'is_vesda' already exists in projects table.")
    else:
        print("Adding 'is_vesda' column to projects table...")
        cursor.execute("ALTER TABLE projects ADD COLUMN is_vesda BOOLEAN DEFAULT 0")
        conn.commit()
        print("Successfully added 'is_vesda' column.")

    conn.close()

if __name__ == "__main__":
    migrate()
