"""Provider abstraction for market data.

Defines the base interface and shared types so MacroAI can combine
multiple data providers (Twelve Data for spot commodities, Polygon.io
for CME futures) behind a single /api/futures endpoint.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any


@dataclass
class MarketQuote:
    """Normalized market quote returned by any provider."""
    symbol: str               # MacroAI internal symbol (e.g. "SPX500")
    provider_symbol: str      # The exact symbol used by the provider (e.g. "ESU6")
    name: str
    category: str             # Index, Metal, Energy
    instrument_type: str      # INDEX, FUTURE, COMMODITY, SPOT, ETF
    price: float
    change: float
    change_pct: float
    open: float
    high: float
    low: float
    prev_close: float
    volume: int
    timestamp: str            # ISO 8601 UTC
    source: str               # provider name (e.g. "twelvedata", "polygon")
    data_status: str          # LIVE, STALE, OFFLINE


@dataclass
class ProviderStatus:
    """Health status for a single provider."""
    name: str
    status: str = "OFFLINE"    # LIVE, STALE, OFFLINE
    last_success: str | None = None
    last_error: str | None = None
    instruments: list[str] = field(default_factory=list)


class BaseMarketDataProvider(ABC):
    """Abstract base for all market-data providers."""

    name: str = "base"

    @abstractmethod
    async def fetch_quotes(self) -> list[MarketQuote]:
        """Fetch all quotes this provider is responsible for."""
        ...

    @abstractmethod
    def get_status(self) -> ProviderStatus:
        """Return the current health status of this provider."""
        ...

    @abstractmethod
    async def aclose(self) -> None:
        """Release any resources (HTTP clients, etc.)."""
        ...


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()
