"""Pydantic models for API request/response validation.

These models document the API contract and provide automatic validation
for any POST/PUT bodies. GET endpoints return dicts directly (the routes
already construct the correct shapes).
"""
from __future__ import annotations

from pydantic import BaseModel, Field


class WatchlistItem(BaseModel):
    user_token: str = Field(default="default")
    symbol: str
    kind: str = Field(default="pair")


class WatchlistRemove(BaseModel):
    user_token: str = Field(default="default")
    symbol: str


class HealthResponse(BaseModel):
    status: str = "ok"
    version: str = "1.0.0"
    database: str = "connected"
    market_data: str = "unknown"
