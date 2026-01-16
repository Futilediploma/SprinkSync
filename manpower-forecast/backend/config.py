"""Application configuration."""
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings."""

    # Database
    database_url: str = "sqlite:///./manpower_forecast.db"

    # Server
    host: str = "0.0.0.0"
    port: int = 8001

    # Authentication
    secret_key: str = "CHANGE-THIS-IN-PRODUCTION-use-a-random-string"

    # CORS
    frontend_url: str = "http://localhost:3000"
    
    @property
    def cors_origins(self) -> List[str]:
        """Get list of allowed CORS origins."""
        return [self.frontend_url, "http://localhost:3000", "http://127.0.0.1:3000"]
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
