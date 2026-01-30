from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # Database
    database_url: str = "sqlite:///./ifield_sync.db"

    # Email Configuration
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = ""
    default_email_to: str = ""

    # ProjectSight API
    projectsight_api_key: str = ""
    projectsight_api_url: str = "https://api.projectsight.com/v1"
    projectsight_project_id: str = ""

    # Application
    cors_origins: str = "http://localhost:3000,http://localhost:5173"
    secret_key: str = "dev-secret-key-change-in-production"

    class Config:
        env_file = ".env"
        case_sensitive = False

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]


settings = Settings()
