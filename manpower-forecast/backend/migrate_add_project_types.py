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
        # Check if columns exist
        cursor.execute("PRAGMA table_info(projects)")
        columns = [info[1] for info in cursor.fetchall()]
        
        if "is_mechanical" not in columns:
            print("Adding 'is_mechanical' column...")
            cursor.execute("ALTER TABLE projects ADD COLUMN is_mechanical BOOLEAN DEFAULT 0")
            
        if "is_electrical" not in columns:
            print("Adding 'is_electrical' column...")
            cursor.execute("ALTER TABLE projects ADD COLUMN is_electrical BOOLEAN DEFAULT 0")
            
        conn.commit()
        print("Migration successful.")
            
    except Exception as e:
        print(f"Migration failed: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
