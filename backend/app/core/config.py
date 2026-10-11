import os
from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    PROJECT_NAME: str = "EduTrack AI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = Field(
        default="edutrack_ai_super_secret_production_key_must_be_changed_via_env_1234567890",
        description="JWT Secret key"
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Database: defaults to local sqlite for zero-config run, or postgresql if specified
    DATABASE_URL: str = Field(
        default="sqlite:///./edutrack.db",
        description="Database connection URI"
    )
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]
    
    # Admin Seed Credentials (for development)
    FIRST_ADMIN_EMAIL: str = "admin@edutrack.edu"
    FIRST_ADMIN_PASSWORD: str = "Admin@EduTrack2026"
    FIRST_ADMIN_NAME: str = "System Administrator"
    
    # Environment
    ENVIRONMENT: str = "development"

    class Config:
        env_file = str(Path(__file__).resolve().parents[3] / ".env")
        case_sensitive = True

settings = Settings()
