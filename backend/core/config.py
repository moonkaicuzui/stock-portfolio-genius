"""
Configuration settings for Stock Portfolio Genius
"""

import os
from typing import Optional
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings"""

    # App
    APP_NAME: str = "Stock Portfolio Genius"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Database
    DATABASE_URL: str = "sqlite:///./data/portfolio.db"

    # CORS
    CORS_ORIGINS: list = ["http://localhost:3000", "http://127.0.0.1:3000"]

    # API Keys (optional)
    FINNHUB_API_KEY: Optional[str] = None
    TIINGO_API_KEY: Optional[str] = None
    ALPHA_VANTAGE_API_KEY: Optional[str] = None

    # Ollama (Local LLM)
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3.1:8b"

    # Cache TTL (seconds)
    QUOTE_CACHE_TTL: int = 60  # 1 minute
    INFO_CACHE_TTL: int = 3600  # 1 hour
    HISTORICAL_CACHE_TTL: int = 300  # 5 minutes

    # Background Tasks
    PRICE_UPDATE_INTERVAL: int = 60  # seconds
    ALERT_CHECK_INTERVAL: int = 30  # seconds

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()


# Quick access
settings = get_settings()
