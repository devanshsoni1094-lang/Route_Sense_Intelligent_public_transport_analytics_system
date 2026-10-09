import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="ignore")

    PROJECT_NAME: str = "RouteSense — Intelligent Public Transport Analytics Platform"
    PROJECT_TAGLINE: str = "From Transport Data to Intelligent Decisions"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "routesense-super-secret-key-change-in-production-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./iptap.db")
    
    # Regional & Agency defaults
    TIMEZONE: str = "Asia/Kolkata"
    CURRENCY_SYMBOL: str = "₹"
    DIST_UNIT: str = "km"
    DEFAULT_AGENCY_NAME: str = "Bengaluru Metropolitan Transport Corporation (BMTC)"
    DEFAULT_AGENCY_ID: str = "BMTC_BLR"
    
    # Operational Thresholds
    ON_TIME_TOLERANCE_EARLY_MIN: float = 1.0  # 1 min early allowed
    ON_TIME_TOLERANCE_LATE_MIN: float = 5.0   # 5 min late allowed
    STALE_FEED_THRESHOLD_SECONDS: int = 300   # 5 minutes without GPS update = stale
    
    # System Operating Mode
    DEMO_MODE: bool = True

settings = Settings()
