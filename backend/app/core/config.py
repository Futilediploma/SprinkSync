from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    # Database - Using SQLite for development, PostgreSQL for production
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./sprinksync.db")
    
    # For production, use PostgreSQL:
    # DATABASE_URL: str = "postgresql://user:password@localhost:5432/construction_db"
    
    # API
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "SprinkSync Construction Management Platform"
    
    # Security - NEVER use default keys in production
    SECRET_KEY: str = os.getenv("SECRET_KEY", "go336NnHwgfqmEwhUU2vmCNcBrFu_6kUeaDDFJM79K8")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Email (for invitations)
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USERNAME: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    EMAIL_FROM: Optional[str] = None
    
    # CORS - Environment-based configuration
    ALLOWED_ORIGINS: str = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:3001")
    
    @property
    def cors_origins(self) -> list:
        """Convert ALLOWED_ORIGINS string to list"""
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]
    
    # Environment - Production settings
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"
    
    class Config:
        env_file = ".env"
        extra = "ignore"  # Allow extra fields from environment

settings = Settings()
