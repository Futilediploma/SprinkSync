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

    # SharePoint / rclone sync
    rclone_remote: str = "onedrive"
    sharepoint_file_remote_path: str = ""
    sharepoint_local_path: str = "./data/pipeline_tracker.xlsx"
    sharepoint_sync_enabled: bool = False
    sharepoint_sync_interval_minutes: int = 60
    sharepoint_min_probability: int = 90

    @property
    def cors_origins(self) -> List[str]:
        """Get list of allowed CORS origins."""
        return [self.frontend_url, "http://localhost:3000", "http://127.0.0.1:3000"]
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
