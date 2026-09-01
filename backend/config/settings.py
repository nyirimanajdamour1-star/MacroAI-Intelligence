"""Centralized configuration loaded from environment variables.

No secret ever leaves the backend. The frontend only talks to our FastAPI
endpoints and never sees any of the keys configured here.
"""
from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


BACKEND_DIR = Path(__file__).resolve().parent.parent
PROJECT_DIR = BACKEND_DIR.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=str(PROJECT_DIR / ".env"), extra="ignore")

    # --- Server -----------------------------------------------------------
    host: str = "0.0.0.0"
    port: int = 8000
    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

    # --- Database ---------------------------------------------------------
    db_path: str = str(BACKEND_DIR / "database" / "macroai.db")

    # --- External data API keys (all optional — services degrade gracefully) ---
    fred_api_key: str = ""
    tradingeconomics_token: str = ""
    newsapi_key: str = ""
    alpha_vantage_key: str = ""
    twelve_data_key: str = ""
    polygon_api_key: str = ""
    api_ninjas_key: str = ""

    # --- Scheduler --------------------------------------------------------
    # Intervals in seconds. Zero disables a feed (useful in dev).
    interval_forex: int = 10
    interval_markets: int = 30
    interval_macro: int = 300
    interval_calendar: int = 60
    interval_news: int = 300
    interval_central_banks: int = 3600
    interval_futures: int = 60

    # --- Scoring engine ---------------------------------------------------
    # When true, the engine recomputes scores on every request. When false it
    # only recomputes when the scheduler triggers it.
    score_on_request: bool = True

    @property
    def database_url(self) -> str:
        return f"sqlite:///{self.db_path}"


@lru_cache
def get_settings() -> Settings:
    return Settings()


def env(name: str, default: str = "") -> str:
    return os.environ.get(name, default)
