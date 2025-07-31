"""
Environment configuration for SprinkSync
Automatically loads the correct .env file based on ENVIRONMENT variable
"""
import os
from functools import lru_cache
from pydantic_settings import BaseSettings
from typing import List, ClassVar


class Settings(BaseSettings):
    """Application settings that automatically load from environment files"""
    
    # Core Settings
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    SECRET_KEY: str
    JWT_SECRET_KEY: str
    
    # Database
    DATABASE_URL: str
    
    # JWT Configuration
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    JWT_ALGORITHM: str = "HS256"
    
    # CORS Configuration
    ALLOWED_ORIGINS: str = "http://localhost:3000"
    ALLOWED_HOSTS: str = "localhost"
    
    # Email Configuration
    SMTP_HOST: str = "localhost"
    SMTP_PORT: int = 1025
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    EMAIL_FROM: str = "noreply@sprinksync.com"
    
    # File Upload Security
    MAX_FILE_SIZE_MB: int = 10
    ALLOWED_FILE_TYPES: str = "pdf,jpg,jpeg,png,doc,docx,txt"
    UPLOAD_DIRECTORY: str = "./uploads"
    
    # OpenAI Integration
    OPENAI_API_KEY: str = ""
    
    # Security Headers
    SECURE_SSL_REDIRECT: bool = False
    SECURE_PROXY_SSL_HEADER: str = ""
    SECURE_HSTS_SECONDS: int = 0
    SECURE_HSTS_INCLUDE_SUBDOMAINS: bool = False
    SECURE_CONTENT_TYPE_NOSNIFF: bool = False
    SECURE_BROWSER_XSS_FILTER: bool = False
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    LOGIN_RATE_LIMIT_PER_MINUTE: int = 5
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "./logs/app.log"
    
    # Monitoring
    SENTRY_DSN: str = ""
    
    class Config:
        env_file = ".env.development"
    
    def get_allowed_origins_list(self) -> List[str]:
        """Convert ALLOWED_ORIGINS string to list"""
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(',')]
    
    def get_allowed_hosts_list(self) -> List[str]:
        """Convert ALLOWED_HOSTS string to list"""
        return [host.strip() for host in self.ALLOWED_HOSTS.split(',')]
    
    def get_allowed_file_types_list(self) -> List[str]:
        """Convert ALLOWED_FILE_TYPES string to list"""
        return [file_type.strip() for file_type in self.ALLOWED_FILE_TYPES.split(',')]


@lru_cache()
def get_settings() -> Settings:
    """
    Get application settings (cached for performance)
    
    Usage:
        from config import get_settings
        settings = get_settings()
    """
    return Settings()


# For convenience
settings = get_settings()
