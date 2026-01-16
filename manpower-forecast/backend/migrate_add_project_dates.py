import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Add the current directory to the python path
sys.path.append(os.getcwd())

# Load environment variables
load_dotenv()

# Database URL
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./manpower.db")

def migrate():
    """Add start_date and end_date columns to projects table."""
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as conn:
        print("Adding start_date and end_date columns to projects table...")
        try:
            # Add start_date column
            conn.execute(text("ALTER TABLE projects ADD COLUMN start_date DATE"))
            print("Added start_date column.")
        except Exception as e:
            print(f"Error adding start_date (might already exist): {e}")

        try:
            # Add end_date column
            conn.execute(text("ALTER TABLE projects ADD COLUMN end_date DATE"))
            print("Added end_date column.")
        except Exception as e:
            print(f"Error adding end_date (might already exist): {e}")
            
        conn.commit()
    
    print("Migration complete.")

if __name__ == "__main__":
    migrate()
