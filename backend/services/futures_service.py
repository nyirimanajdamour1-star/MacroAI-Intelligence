"""Futures data service — combines multiple providers behind a single endpoint.

Provider responsibilities:
  TwelveDataProvider          -> XAUUSD (Gold Spot, live)
  ApiNinjasCommodityProvider  -> XAGUSD, WTI, BRENT (15-minute delayed futures)
  YahooFuturesProvider        -> SPX500, US100, US30 (delayed/unofficial index futures)

The /api/futures endpoint merges quotes from all providers. Each provider
is queried independently and its health status is tracked separately so
the health endpoint can report per-provider LIVE/STALE/OFFLINE.

STALE-from-DB logic: when a provider fails for an instrument, the service
returns the last successfully stored price from the database (if any)
with data_status=STALE, rather than showing a zero price or seed data.
"""
from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from typing import Any

from backend.config.settings import get_settings
from backend.database.connection import query_all, query_one, execute
from backend.services.providers import BaseMarketDataProvider, MarketQuote, ProviderStatus
from backend.services.providers.twelve_data import TwelveDataProvider
from backend.services.providers.api_ninjas import ApiNinjasCommodityProvider
from backend.services.providers.yahoo_futures import YahooFuturesProvider

logger = logging.getLogger("macroai.services.futures")

INSTRUMENT_CONFIG: dict[str, dict[str, Any]] = {
    "SPX500": {"name": "S&P 500 E-mini Futures",    "category": "Index",  "provider": "yahoo_futures",       "instrument_type": "FUTURE"},
    "US100":  {"name": "Nasdaq-100 E-mini Futures", "category": "Index",  "provider": "yahoo_futures",       "instrument_type": "FUTURE"},
    "US30":   {"name": "Dow Jones E-mini Futures",  "category": "Index",  "provider": "yahoo_futures",       "instrument_type": "FUTURE"},
    "XAUUSD": {"name": "Gold Spot",                "category": "Metal",  "provider": "twelvedata",          "instrument_type": "SPOT"},
    "XAGUSD": {"name": "Silver Futures",            "category": "Metal",  "provider": "api_ninjas", "instrument_type": "FUTURE"},
    "WTI":    {"name": "Crude Oil Futures",         "category": "Energy", "provider": "api_ninjas", "instrument_type": "FUTURE"},
    "BRENT":  {"name": "Brent Crude Oil Futures",   "category": "Energy", "provider": "api_ninjas", "instrument_type": "FUTURE"},
}

_providers: dict[str, BaseMarketDataProvider] = {}


def _get_providers() -> dict[str, BaseMarketDataProvider]:
    global _providers
    if not _providers:
        settings = get_settings()
        _providers["twelvedata"] = TwelveDataProvider(settings.twelve_data_key)
        _providers["api_ninjas"] = ApiNinjasCommodityProvider(settings.api_ninjas_key)
        _providers["yahoo_futures"] = YahooFuturesProvider()
    return _providers


class FuturesService:
    """Orchestrates multiple providers and persists combined results to SQLite."""

    def __init__(self, settings: Any = None) -> None:
        self.settings = settings or get_settings()

    async def aclose(self) -> None:
        for provider in _get_providers().values():
            await provider.aclose()

    async def fetch_all(self) -> list[dict[str, Any]]:
        """Fetch quotes from all providers and upsert into the futures table."""
        providers = _get_providers()
        all_quotes: list[MarketQuote] = []

        for name, provider in providers.items():
            logger.info("futures: fetching from provider=%s", name)
            quotes = await provider.fetch_quotes()
            all_quotes.extend(quotes)

        # Persist live quotes to DB
        for q in all_quotes:
            if q.data_status in ("LIVE", "DELAYED"):
                _upsert_live(q)
            elif q.data_status == "STALE":
                _mark_stale(q)

        # Read all rows from DB (includes persisted live + STALE-from-DB for failed)
        return get_all_futures()


def _mark_stale(q: MarketQuote) -> None:
    """Mark the last known provider value stale without replacing its price."""
    execute(
        """
        UPDATE futures
        SET data_status = 'STALE'
        WHERE symbol = ? AND source IN ('twelvedata', 'api_ninjas', 'yahoo_futures', 'polygon')
        """,
        (q.symbol,),
    )


def _upsert_live(q: MarketQuote) -> None:
    """Write a provider quote into the futures table with AI-derived fields."""
    price = q.price
    prev = q.prev_close or price
    change = q.change if q.change else round(price - prev, 4)
    change_pct = q.change_pct if q.change_pct else round(((price - prev) / prev * 100), 2) if prev else 0.0
    high = q.high or price
    low = q.low or price
    open_price = q.open or prev

    trend = "up" if change > 0 else "down" if change < 0 else "flat"
    atr = round(abs(high - low) if high and low else price * 0.01, 4)
    support = round(min(low, price - atr * 1.5), 4) if low else round(price * 0.99, 4)
    resistance = round(max(high, price + atr * 1.5), 4) if high else round(price * 1.01, 4)

    ai_score = _compute_ai_score(q.change_pct, atr, price, prev)
    bias = "buy" if ai_score >= 60 else "sell" if ai_score <= 40 else "neutral"
    confidence = min(95, max(40, 50 + abs(q.change_pct) * 5 + (atr / price * 100 if price else 0)))

    history = _append_history(q.symbol, price)

    execute(
        """
        INSERT INTO futures (symbol, name, category, price, change, change_pct, trend,
            ai_score, bias, confidence, support, resistance, atr, volume,
            high, low, open, prev_close, history, timestamp, source, data_status,
            provider_symbol, instrument_type)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(symbol) DO UPDATE SET
            price=excluded.price, change=excluded.change, change_pct=excluded.change_pct,
            trend=excluded.trend, ai_score=excluded.ai_score, bias=excluded.bias,
            confidence=excluded.confidence, support=excluded.support, resistance=excluded.resistance,
            atr=excluded.atr, volume=excluded.volume, high=excluded.high, low=excluded.low,
            open=excluded.open, prev_close=excluded.prev_close, history=excluded.history,
            timestamp=excluded.timestamp, source=excluded.source, data_status=excluded.data_status,
            provider_symbol=excluded.provider_symbol, instrument_type=excluded.instrument_type
        """,
        (q.symbol, q.name, q.category, price, change, change_pct, trend,
         ai_score, bias, confidence, support, resistance, atr, q.volume,
         high, low, open_price, prev, json.dumps(history),
         q.timestamp, q.source, q.data_status,
         q.provider_symbol, q.instrument_type),
    )


def _compute_ai_score(change_pct: float, atr: float, price: float, prev_close: float) -> float:
    momentum_score = 50 + change_pct * 8
    direction_bonus = 10 if change_pct > 0.5 else -10 if change_pct < -0.5 else 0
    score = momentum_score + direction_bonus
    return round(max(5, min(100, score)), 1)


def _append_history(symbol: str, price: float) -> list[dict[str, Any]]:
    row = query_one("SELECT history FROM futures WHERE symbol = ?", (symbol,))
    history: list[dict[str, Any]] = []
    if row and row.get("history"):
        try:
            history = json.loads(row["history"])
        except (json.JSONDecodeError, TypeError):
            history = []
    today = datetime.now(timezone.utc).isoformat()[:10]
    history.append({"date": today, "price": round(price, 2)})
    return history[-30:]


def get_all_futures() -> list[dict[str, Any]]:
    """Read all futures rows from the DB.

    For instruments where the provider returned STALE (failed this cycle),
    we keep the last successfully stored price and mark it STALE rather than
    showing a zero price. Seed-only data (never updated by a live fetch)
    remains OFFLINE.
    """
    rows = query_all(
        "SELECT symbol, name, category, price, change, change_pct, trend, "
        "ai_score, bias, confidence, support, resistance, atr, volume, "
        "high, low, open, prev_close, history, timestamp, source, data_status, "
        "provider_symbol, instrument_type "
        "FROM futures ORDER BY category, symbol"
    )
    for row in rows:
        try:
            row["history"] = json.loads(row.get("history") or "[]")
        except (json.JSONDecodeError, TypeError):
            row["history"] = []

        source = row.get("source") or "seed"
        stored_status = row.get("data_status") or ""

        # Determine effective data_status
        if stored_status in ("LIVE", "DELAYED", "STALE") and source in ("twelvedata", "api_ninjas", "yahoo_futures", "polygon"):
            row["data_status"] = stored_status
        elif source in ("seed", "none"):
            row["data_status"] = "OFFLINE"
            row["price"] = None
            row["change"] = None
            row["change_pct"] = None
            row["open"] = None
            row["high"] = None
            row["low"] = None
            row["prev_close"] = None
            row["history"] = []
        else:
            row["data_status"] = "STALE"

        # Ensure instrument_type from config
        sym = row["symbol"]
        if sym in INSTRUMENT_CONFIG:
            row["name"] = INSTRUMENT_CONFIG[sym]["name"]
            row["category"] = INSTRUMENT_CONFIG[sym]["category"]
            if not row.get("instrument_type"):
                row["instrument_type"] = INSTRUMENT_CONFIG[sym]["instrument_type"]

    return rows


def get_provider_statuses() -> dict[str, dict[str, Any]]:
    """Return the health status of each provider as a dict."""
    statuses: dict[str, dict[str, Any]] = {}
    for name, provider in _get_providers().items():
        s = provider.get_status()
        statuses[name] = {
            "name": s.name,
            "status": s.status,
            "last_success": s.last_success,
            "last_error": s.last_error,
            "instruments": s.instruments,
        }
    return statuses
