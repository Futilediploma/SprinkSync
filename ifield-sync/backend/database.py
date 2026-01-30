from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, Boolean, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
from config import settings

# Create database engine
engine = create_engine(
    settings.database_url, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


class Job(Base):
    """Job model - represents a job that can be filled out via share link"""
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    share_token = Column(String, unique=True, index=True, nullable=False)
    form_type = Column(String, default="service_order")  # "service_order" or "certificate"
    customer_name = Column(String, nullable=False)
    customer_address = Column(Text)
    account_number = Column(String)
    person_to_see = Column(String)
    terms = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)


class Submission(Base):
    """Submission model - represents a completed field ticket"""
    __tablename__ = "submissions"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, nullable=False)
    share_token = Column(String, index=True)

    # Project info
    customer_name = Column(String)
    customer_address = Column(Text)
    account_number = Column(String)
    date_of_call = Column(String)
    person_to_see = Column(String)
    terms = Column(String)

    # Work details
    special_instructions = Column(Text)
    time_in = Column(String)
    time_out = Column(String)

    # Materials (stored as JSON string)
    materials = Column(Text)

    # Signatures (stored as base64 data URLs)
    gc_signature = Column(Text)
    tech_signature = Column(Text)

    # Photos (stored as comma-separated filenames)
    photos = Column(Text)

    # PDF filename
    pdf_filename = Column(String)

    # Upload status
    uploaded_to_projectsight = Column(Boolean, default=False)
    emailed = Column(Boolean, default=False)
    upload_notes = Column(Text)

    # Timestamps
    submitted_at = Column(DateTime, default=datetime.utcnow)

    # Calculated fields
    subtotal = Column(Float, default=0.0)
    tax = Column(Float, default=0.0)
    total = Column(Float, default=0.0)



class CertificateSubmission(Base):
    """Certificate submission model - represents a completed aboveground certificate"""
    __tablename__ = "certificate_submissions"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, nullable=False)
    share_token = Column(String, index=True)

    # Project information
    job_name = Column(String)
    job_location = Column(Text)
    permit_number = Column(String)
    ahj = Column(String)  # Authority Having Jurisdiction

    # Contractor information
    contractor_name = Column(String)
    contractor_address = Column(Text)
    contractor_license = Column(String)
    contractor_phone = Column(String)

    # Installer information
    installer_name = Column(String)
    installer_license = Column(String)
    installer_phone = Column(String)

    # System information
    system_type = Column(String)  # e.g., "Wet", "Dry", "Deluge", "Pre-Action"
    occupancy_classification = Column(String)

    # Piping information (stored as JSON string for multiple pipe entries)
    piping_data = Column(Text)

    # Test information
    test_type = Column(String)  # e.g., "Hydrostatic", "Pneumatic"
    test_pressure = Column(String)
    test_medium = Column(String)  # e.g., "Water", "Air", "Nitrogen"
    test_duration = Column(String)
    test_results = Column(String)  # e.g., "Pass", "Fail"
    test_date = Column(String)
    test_notes = Column(Text)

    # Materials used (stored as JSON string)
    materials = Column(Text)

    # Signatures (stored as base64 data URLs)
    installer_signature = Column(Text)
    contractor_signature = Column(Text)
    inspector_signature = Column(Text)

    # Photos (stored as comma-separated filenames)
    photos = Column(Text)

    # PDF filename
    pdf_filename = Column(String)

    # Upload status
    uploaded_to_projectsight = Column(Boolean, default=False)
    emailed = Column(Boolean, default=False)
    upload_notes = Column(Text)

    # Timestamps
    submitted_at = Column(DateTime, default=datetime.utcnow)


class Project(Base):
    """Project model for manpower forecasting"""
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    job_number = Column(String, unique=True, index=True, nullable=False)
    job_name = Column(String, nullable=False)
    designer = Column(String, nullable=True)
    superintendent = Column(String, nullable=True)
    total_labor_hours = Column(Integer, default=0)
    labor_budget = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)


class ManpowerForecast(Base):
    as_dict = True
    """Manpower forecast model"""
    __tablename__ = "manpower_forecasts"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, index=True, nullable=False)
    hours_completed = Column(Integer, default=0)
    start_month = Column(String)  # Stored as YYYY-MM
    end_month = Column(String)    # Stored as YYYY-MM
    created_at = Column(DateTime, default=datetime.utcnow)


class MonthlyForecastAllocation(Base):
    """Monthly forecast allocation model"""
    __tablename__ = "monthly_forecast_allocations"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, index=True, nullable=False)
    month = Column(String, nullable=False)  # Stored as YYYY-MM
    forecast_hours = Column(Float, default=0.0)



def get_db():
    """Dependency for getting database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initialize database tables"""
    Base.metadata.create_all(bind=engine)
