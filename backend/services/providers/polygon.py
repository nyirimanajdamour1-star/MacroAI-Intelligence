"""Polygon.io (Massive) provider — real CME futures data.

Provides actual futures contract data for:
  SPX500 -> ES (E-mini S&P 500 Futures, CME)
  US100  -> NQ (E-mini Nasdaq-100 Futures, CME)
  US30   -> YM (E-mini Dow Jones Futures, CBOT)

Polygon.io's futures API covers CME, CBOT, NYMEX, and COMEX.
The free Basic tier ($0) provides end-of-day historical aggregates (5 API calls/min).
The Starter tier ($29/mo) provides 10-minute delayed data.
The Advanced tier ($199/mo) provides real-time data.

This provider uses the previous-day aggregates endpoint (/v2/aggs/ticker/{symbol}/prev)
which returns OHLC + volume + previous close. On the free tier this gives end-of-day
data for the front-month continuous contract. We use the snapshot endpoint when
available for more recent pricing.

Futures ticker format on Polygon: the root symbol (ES, NQ, YM) followed by
the expiry month code and year (e.g., ESU6 for September 2026). We compute
the front-month contract dynamically so we always request the active contract.
"""
from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timezone
from typing import Any

import httpx

from backend.services.providers import BaseMarketDataProvider, MarketQuote, ProviderStatus, now_iso

logger = logging.getLogger("macroai.providers.polygon")

API_BASE = "https://api.polygon.io"

# CME futures month codes for computing the front-month contract
_MONTH_CODES = {
    3: "H",   # March
    6: "M",   # June
    9: "U",   # September
    12: "Z",  # December
}

# Quarterly expiry cycle months for ES, NQ, YM
_EXPIRY_MONTHS = [3, 6, 9, 12]

INSTRUMENTS: dict[str, dict[str, str]] = {
    "SPX500": {"root": "ES", "name": "S&P 500 Index",   "category": "Index", "instrument_type": "FUTURE"},
    "US100":  {"root": "NQ", "name": "Nasdaq 100 Index", "category": "Index", "instrument_type": "FUTURE"},
    "US30":   {"root": "YM", "name": "Dow Jones Industrial", "category": "Index", "instrument_type": "FUTURE"},
}

RATE_LIMIT_DELAY = 12.0  # 5 calls/min on free tier — 12s between calls is safe


def _front_month_ticker(root: str) -> str:
    """Compute the current front-month CME futures ticker for a root symbol.

    CME quarterly futures expire on the 3rd Friday of March, June, September, December.
    We pick the nearest expiry month that hasn't passed yet (with a small buffer).
    """
    now = datetime.now(timezone.utc)
    year_2digit = now.year % 100

    for i, month in enumerate(_EXPIRY_MONTHS):
        # Approximate expiry: 3rd Friday is around day 15-21
        # We add a buffer so we switch before expiry week
        expiry_approx = datetime(now.year, month, 20, tzinfo=timezone.utc)
        if expiry_approx > now:
            return f"{root}{_MONTH_CODES[month]}{year_2digit}"
    # All expiries this year have passed — use next year's March
    return f"{root}H{(year_2digit + 1) % 100}"


class PolygonFuturesProvider(BaseMarketDataProvider):
    name = "polygon"

    def __init__(self, api_key: str) -> None:
        self.api_key = api_key
        self.client = httpx.AsyncClient(timeout=20.0)
        self._status = ProviderStatus(
            name=self.name,
            status="OFFLINE" if not api_key else "OFFLINE",
            instruments=list(INSTRUMENTS.keys()),
        )

    async def aclose(self) -> None:
        await self.client.aclose()

    async def fetch_quotes(self) -> list[MarketQuote]:
        if not self.api_key:
            logger.warning("polygon: no API key — skipping")
            self._status.status = "OFFLINE"
            self._status.last_error = "no_api_key"
            return []

        quotes: list[MarketQuote] = []
        any_live = False

        for internal_sym, cfg in INSTRUMENTS.items():
            ticker = _front_month_ticker(cfg["root"])
            quote = await self._fetch_one(ticker)
            if quote is not None:
                any_live = True
                quotes.append(MarketQuote(
                    symbol=internal_sym,
                    provider_symbol=ticker,
                    name=cfg["name"],
                    category=cfg["category"],
                    instrument_type=cfg["instrument_type"],
                    price=quote["close"],
                    change=quote["change"],
                    change_pct=quote["change_pct"],
                    open=quote["open"],
                    high=quote["high"],
                    low=quote["low"],
                    prev_close=quote["prev_close"],
                    volume=quote["volume"],
                    timestamp=quote["timestamp"],
                    source=self.name,
                    data_status="LIVE",
                ))
            else:
                quotes.append(MarketQuote(
                    symbol=internal_sym,
                    provider_symbol=ticker,
                    name=cfg["name"],
                    category=cfg["category"],
                    instrument_type=cfg["instrument_type"],
                    price=0, change=0, change_pct=0, open=0, high=0, low=0,
                    prev_close=0, volume=0,
                    timestamp=now_iso(),
                    source=self.name,
                    data_status="STALE",
                ))
            await asyncio.sleep(RATE_LIMIT_DELAY)

        if any_live:
            self._status.status = "LIVE"
            self._status.last_success = now_iso()
            self._status.last_error = None
            logger.info("polygon: live futures data fetched successfully")
        else:
            self._status.status = "STALE"
            self._status.last_error = "all_requests_failed"
            logger.warning("polygon: all futures requests failed")

        return quotes

    async def _fetch_one(self, ticker: str) -> dict[str, Any] | None:
        """Fetch a futures quote from Polygon.io.

        Uses the /v2/aggs/ticker/{ticker}/prev endpoint which returns the
        previous day's OHLC bar. This works on the free Basic tier.
        """
        try:
            # Try the snapshot endpoint first (works on paid tiers with real-time/delayed)
            snap = await self._try_snapshot(ticker)
            if snap is not None:
                return snap

            # Fall back to previous-day aggregates (works on free Basic tier)
            return await self._try_prev_agg(ticker)
        except Exception:
            logger.warning("polygon: fetch error for %s", ticker)
            return None

    async def _try_snapshot(self, ticker: str) -> dict[str, Any] | None:
        """Try the snapshot endpoint (paid tiers)."""
        try:
            resp = await self.client.get(
                f"{API_BASE}/v2/snapshot/locale/us/markets/futures/{ticker}",
                params={"apiKey": self.api_key},
            )
            if resp.status_code == 403:
                logger.info("polygon: snapshot endpoint not available for this tier (403)")
                return None
            resp.raise_for_status()
            data = resp.json()
            snap = data.get("results", {}).get("value")
            if not snap or "day" not in snap:
                return None

            price = float(snap.get("last_quote", {}).get("p") or snap.get("last_trade", {}).get("p") or 0)
            if not price:
                return None

            day = snap.get("day", {})
            prev = float(snap.get("prev_day", {}).get("c") or 0)
            change = round(price - prev, 4) if prev else 0
            change_pct = round((price - prev) / prev * 100, 2) if prev else 0

            return {
                "close": price,
                "open": float(day.get("o") or 0),
                "high": float(day.get("h") or 0),
                "low": float(day.get("l") or 0),
                "prev_close": prev,
                "volume": int(float(snap.get("day", {}).get("v") or 0)),
                "change": change,
                "change_pct": change_pct,
                "timestamp": now_iso(),
            }
        except httpx.HTTPStatusError as exc:
            if exc.response.status_code == 403:
                logger.info("polygon: snapshot not available for this tier")
                return None
            logger.warning("polygon: snapshot HTTP %s for %s", exc.response.status_code, ticker)
            return None
        except httpx.HTTPError:
            logger.warning("polygon: snapshot connection error for %s", ticker)
            return None
        except Exception:
            logger.warning("polygon: snapshot unexpected error for %s", ticker)
            return None

    async def _try_prev_agg(self, ticker: str) -> dict[str, Any] | None:
        """Try the previous-day aggregates endpoint (free Basic tier)."""
        try:
            resp = await self.client.get(
                f"{API_BASE}/v2/aggs/ticker/{ticker}/prev",
                params={"apiKey": self.api_key, "adjusted": "true"},
            )
            if resp.status_code == 403:
                logger.warning("polygon: prev agg endpoint returned 403 for %s — check API key/entitlement", ticker)
                return None
            if resp.status_code == 429:
                logger.warning("polygon: rate limit hit for %s", ticker)
                return None
            resp.raise_for_status()
            data = resp.json()

            if data.get("status") == "ERROR":
                err = data.get("error", "unknown")
                if "rate" in err.lower():
                    logger.warning("polygon: rate limit hit for %s", ticker)
                else:
                    logger.warning("polygon: API error for %s", ticker)
                return None

            results = data.get("results", [])
            if not results:
                logger.warning("polygon: no data for %s — futures entitlement may be required", ticker)
                return None

            bar = results[0]
            close = float(bar.get("c") or 0)
            if not close:
                logger.warning("polygon: no close price for %s", ticker)
                return None

            open_price = float(bar.get("o") or 0)
            high = float(bar.get("h") or 0)
            low = float(bar.get("l") or 0)
            volume = int(float(bar.get("v") or 0))
            prev_close = float(bar.get("o") or close)  # On EOD, open ~= prev close

            change = round(close - open_price, 4) if open_price else 0
            change_pct = round((close - open_price) / open_price * 100, 2) if open_price else 0

            ts_ms = bar.get("t")
            if ts_ms:
                ts = datetime.fromtimestamp(ts_ms / 1000, tz=timezone.utc).isoformat()
            else:
                ts = now_iso()

            return {
                "close": close,
                "open": open_price,
                "high": high,
                "low": low,
                "prev_close": open_price,  # EOD endpoint uses open as prev close approx
                "volume": volume,
                "change": change,
                "change_pct": change_pct,
                "timestamp": ts,
            }
        except httpx.HTTPStatusError as exc:
            status_code = exc.response.status_code
            if status_code in (401, 403):
                logger.error("polygon: auth error (%s) for %s — check entitlements", status_code, ticker)
            elif status_code == 429:
                logger.warning("polygon: rate limit hit for %s", ticker)
            else:
                logger.warning("polygon: prev agg HTTP %s for %s", status_code, ticker)
            return None
        except httpx.HTTPError:
            logger.warning("polygon: prev agg connection error for %s", ticker)
            return None
        except Exception:
            logger.warning("polygon: prev agg unexpected error for %s", ticker)
            return None

    def get_status(self) -> ProviderStatus:
        return self._status
