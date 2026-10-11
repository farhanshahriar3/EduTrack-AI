import os
import json
from pathlib import Path
from typing import Annotated, List
from pydantic_settings import BaseSettings
from pydantic import Field, field_validator
from pydantic_settings import NoDecode

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
    BACKEND_CORS_ORIGINS: Annotated[List[str], NoDecode] = [
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

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, value):
        if isinstance(value, list):
            return value
        if isinstance(value, str):
            try:
                parsed = json.loads(value)
                if isinstance(parsed, list):
                    return [str(origin).strip() for origin in parsed if str(origin).strip()]
            except json.JSONDecodeError:
                pass
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    class Config:
        env_file = str(Path(__file__).resolve().parents[3] / ".env")
        case_sensitive = True

settings = Settings()

# Vercel's function filesystem is read-only except for /tmp. A local SQLite
# fallback keeps the hosted demo bootable when no external DATABASE_URL exists.
if os.getenv("VERCEL") and settings.DATABASE_URL == "sqlite:///./edutrack.db":
    settings.DATABASE_URL = "sqlite:////tmp/edutrack.db"
