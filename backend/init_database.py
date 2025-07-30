"""
Initialize the database and create all tables
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import engine
from app.models.construction import Base
from app.models.auth import User, Company, UserInvitation, UserSession  # Import auth models

# Create all tables
print("Creating database tables...")
Base.metadata.create_all(bind=engine)
print("Database tables created successfully!")

# List all tables
from sqlalchemy import inspect
inspector = inspect(engine)
table_names = inspector.get_table_names()
print(f"\nCreated tables: {table_names}")
