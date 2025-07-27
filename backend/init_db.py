"""Database initialization script"""
from sqlalchemy import create_engine
from app.core.database import Base
from app.core.config import settings
from app.models.construction import Project, Task, RFI, ChangeOrder, Inspection

def create_tables():
    """Create all database tables"""
    engine = create_engine(settings.DATABASE_URL)
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")

if __name__ == "__main__":
    create_tables()
