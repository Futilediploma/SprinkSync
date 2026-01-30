import sqlite3
import os

# Database path
DB_PATH = os.path.join(os.path.dirname(__file__), "manpower_forecast.db")

def migrate():
    print(f"Migrating database at {DB_PATH}...")

    if not os.path.exists(DB_PATH):
        print("Database not found. Skipping migration.")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        # Check if column exists
        cursor.execute("PRAGMA table_info(projects)")
        columns = [info[1] for info in cursor.fetchall()]

        if "sub_headcount" not in columns:
            print("Adding 'sub_headcount' column...")
            cursor.execute("ALTER TABLE projects ADD COLUMN sub_headcount INTEGER DEFAULT 0")

        conn.commit()
        print("Migration successful.")

    except Exception as e:
        print(f"Migration failed: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
