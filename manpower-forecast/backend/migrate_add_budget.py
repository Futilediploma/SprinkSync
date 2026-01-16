import sqlite3
import os

# Database path
DB_PATH = os.path.join(os.path.dirname(__file__), "manpower_forecast.db")

def migrate():
    print(f"Migrating database at {DB_PATH}...")
    
    if not os.path.exists(DB_PATH):
        print("Database not found. Skipping migration (tables will be created fresh).")
        return
        
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Check if column exists
        cursor.execute("PRAGMA table_info(projects)")
        columns = [info[1] for info in cursor.fetchall()]
        
        if "budgeted_hours" not in columns:
            print("Adding 'budgeted_hours' column to 'projects' table...")
            cursor.execute("ALTER TABLE projects ADD COLUMN budgeted_hours NUMERIC(10, 2)")
            conn.commit()
            print("Column added successfully.")
        else:
            print("Column 'budgeted_hours' already exists.")
            
    except Exception as e:
        print(f"Migration failed: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
