import os
from pathlib import Path
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "Shelf Signal"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "shelfsignal_super_secure_secret_key_change_in_production_2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./shelf_signal.db")
    UPLOAD_DIR: Path = Path("./storage/uploads").resolve()
    MODELS_DIR: Path = Path("./storage/models").resolve()
    EXPORTS_DIR: Path = Path("./storage/exports").resolve()
    MAX_UPLOAD_SIZE_BYTES: int = 50 * 1024 * 1024  # 50MB
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5175",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ]
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    COOKIE_SECURE: bool = os.getenv("COOKIE_SECURE", "false").lower() == "true"
    DEFAULT_DATASET_PATH: str = r"D:\Downloads\Assessment Datasets\Assessment Datasets\Assessment - 3 [Retail Sales Forecasting and Promotion Effectiveness]\dunnhumby - Breakfast at the Frat.xlsx"

    class Config:
        env_file = ".env"

settings = Settings()
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
settings.MODELS_DIR.mkdir(parents=True, exist_ok=True)
settings.EXPORTS_DIR.mkdir(parents=True, exist_ok=True)
