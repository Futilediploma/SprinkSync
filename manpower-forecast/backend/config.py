"""Application configuration."""
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings."""

    # Deployment identity
    app_brand: str = "SprinkSync"
    app_instance: str = "sprinksync"
    app_env: str = "development"
    log_dir: str = "./logs"
    export_company_name: str = "BFPE International"

    # Database
    database_url: str = "sqlite:///./manpower_forecast.db"

    # Server
    host: str = "0.0.0.0"
    port: int = 8001

    # Authentication
    secret_key: str = "CHANGE-THIS-IN-PRODUCTION-use-a-random-string"
    jwt_secret_key: str = ""
    session_secret: str = ""
    cookie_name: str = "sprinksync_session"

    # Email notifications
    email_provider: str = "postmark"
    postmark_api_key: str = ""
    resend_api_key: str = ""
    email_from: str = ""
    notification_max_attempts: int = 3
    notification_poll_interval_seconds: int = 60

    # CORS
    frontend_url: str = "http://localhost:3000"
    frontend_urls: str = ""

    # Deployment feature flags
    enable_manpower: bool = True
    enable_field_fab: bool = False
    enable_schedule_extractor: bool = False

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
        configured_urls = self.frontend_urls or self.frontend_url
        origins = [
            url.strip()
            for url in configured_urls.split(",")
            if url.strip()
        ]
        origins.extend(["http://localhost:3000", "http://127.0.0.1:3000"])
        return list(dict.fromkeys(origins))

    @property
    def auth_secret_key(self) -> str:
        """JWT signing key with backward-compatible SECRET_KEY fallback."""
        return self.jwt_secret_key or self.secret_key
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
