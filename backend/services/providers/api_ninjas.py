"""API Ninjas provider for oil prices, with Yahoo Finance fallback for Silver.

Uses API Ninjas' /v1/oilprice endpoint (free tier, daily closing price):
  WTI   -> type=wti   (Crude Oil, ~$87/barrel)
  BRENT -> type=brent (Brent Crude Oil, ~$94/barrel)

Silver has no free API Ninjas source, so it falls back to Yahoo Finance
futures (SI=F) and is labeled DELAYED.

Free-tier oil prices are daily closing prices (not real-time), so all
successful quotes are labeled DELAYED, never LIVE.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

import httpx
import yfinance as yf

from backend.services.providers import BaseMarketDataProvider, MarketQuote, ProviderStatus, now_iso

logger = logging.getLogger("macroai.providers.api_ninjas")

OIL_API_URL = "https://api.api-ninjas.com/v1/oilprice"

INSTRUMENTS: dict[str, dict[str, Any]] = {
    "WTI": {
        "endpoint": "oil",
        "oil_type": "wti",
        "provider_symbol": "wti",
        "name": "Crude Oil (WTI)",
        "category": "Energy",
    },
    "BRENT": {
        "endpoint": "oil",
        "oil_type": "brent",
        "provider_symbol": "brent",
        "name": "Brent Crude Oil",
        "category": "Energy",
    },
    "XAGUSD": {
        "endpoint": "yfinance",
        "yf_symbol": "SI=F",
        "provider_symbol": "SI=F",
        "name": "Silver Futures",
        "category": "Metal",
    },
}


class ApiNinjasCommodityProvider(BaseMarketDataProvider):
    """Fetches delayed oil prices from API Ninjas and silver from Yahoo Finance."""

    name = "api_ninjas"

    def __init__(self, api_key: str) -> None:
        self.api_key = api_key
        self.client = httpx.AsyncClient(timeout=15.0)
        self._status = ProviderStatus(
            name=self.name,
            status="OFFLINE",
            instruments=list(INSTRUMENTS.keys()),
        )

    async def aclose(self) -> None:
        await self.client.aclose()

    async def fetch_quotes(self) -> list[MarketQuote]:
        quotes: list[MarketQuote] = []
        any_success = False

        for internal_symbol, cfg in INSTRUMENTS.items():
            if cfg["endpoint"] == "oil":
                quote = await self._fetch_oil(internal_symbol, cfg)
            else:
                quote = await self._fetch_yfinance(internal_symbol, cfg)

            if quote is None:
                quotes.append(MarketQuote(
                    symbol=internal_symbol,
                    provider_symbol=cfg["provider_symbol"],
                    name=cfg["name"],
                    category=cfg["category"],
                    instrument_type="FUTURE",
                    price=0, change=0, change_pct=0, open=0, high=0, low=0,
                    prev_close=0, volume=0,
                    timestamp=now_iso(),
                    source=self.name,
                    data_status="STALE",
                ))
            else:
                any_success = True
                quotes.append(MarketQuote(
                    symbol=internal_symbol,
                    provider_symbol=quote.get("provider_symbol", cfg["provider_symbol"]),
                    name=cfg["name"],
                    category=cfg["category"],
                    instrument_type="FUTURE",
                    price=quote["price"],
                    change=quote["change"],
                    change_pct=quote["change_pct"],
                    open=quote["open"],
                    high=quote["high"],
                    low=quote["low"],
                    prev_close=quote["prev_close"],
                    volume=quote["volume"],
                    timestamp=quote["timestamp"],
                    source=quote["source"],
                    data_status="DELAYED",
                ))

        if any_success:
            self._status.status = "LIVE"
            self._status.last_success = now_iso()
            self._status.last_error = None
            logger.info("api_ninjas: delayed commodity data fetched successfully")
        elif not self.api_key:
            self._status.status = "OFFLINE"
            self._status.last_error = "no_api_key"
            logger.warning("api_ninjas: no API key configured")
        else:
            self._status.status = "STALE"
            self._status.last_error = "all_requests_failed"
            logger.warning("api_ninjas: all commodity requests failed")

        return quotes

    async def _fetch_oil(self, internal_symbol: str, cfg: dict[str, Any]) -> dict[str, Any] | None:
        if not self.api_key:
            return None
        try:
            response = await self.client.get(
                OIL_API_URL,
                params={"type": cfg["oil_type"]},
                headers={"X-Api-Key": self.api_key},
            )
            response.raise_for_status()
            data = response.json()

            if data.get("error") or not data.get("price"):
                logger.warning("api_ninjas: no usable oil data for %s", internal_symbol)
                return None

            price = float(data["price"])
            previous_close = float(data.get("previous_close") or 0)
            change = float(data.get("change_24h") or (price - previous_close if previous_close else 0))
            change_pct = float(data.get("change_24h_percent") or ((change / previous_close) * 100 if previous_close else 0))
            updated = data.get("updated")
            timestamp = datetime.fromtimestamp(updated, timezone.utc).isoformat() if updated else now_iso()

            return {
                "price": price,
                "change": change,
                "change_pct": change_pct,
                "open": previous_close or price,
                "high": price,
                "low": price,
                "prev_close": previous_close or price,
                "volume": 0,
                "timestamp": timestamp,
                "provider_symbol": cfg["oil_type"],
                "source": self.name,
            }
        except httpx.HTTPStatusError as exc:
            logger.warning("api_ninjas: HTTP %s for %s", exc.response.status_code, internal_symbol)
            return None
        except httpx.HTTPError:
            logger.warning("api_ninjas: connection error for %s", internal_symbol)
            return None
        except (KeyError, TypeError, ValueError):
            logger.warning("api_ninjas: invalid oil response for %s", internal_symbol)
            return None

    async def _fetch_yfinance(self, internal_symbol: str, cfg: dict[str, Any]) -> dict[str, Any] | None:
        yf_symbol = cfg["yf_symbol"]
        try:
            ticker = yf.Ticker(yf_symbol)
            info = ticker.fast_info
            hist = ticker.history(period="5d")

            last_price = float(info.last_price or 0)
            prev_close = float(info.previous_close or 0)

            if not last_price or str(last_price) == "nan":
                if len(hist) > 0:
                    last_price = float(hist.iloc[-1]["Close"])
                else:
                    logger.warning("api_ninjas: yfinance no price for %s", yf_symbol)
                    return None

            if not prev_close or str(prev_close) == "nan":
                if len(hist) > 1:
                    prev_close = float(hist.iloc[-2]["Close"])
                elif len(hist) > 0 and float(hist.iloc[-1].get("Open", 0)) > 0:
                    prev_close = float(hist.iloc[-1]["Open"])
                else:
                    prev_close = last_price

            open_price = 0.0
            high = 0.0
            low = 0.0
            volume = 0
            if len(hist) > 0:
                row = hist.iloc[-1]
                open_price = float(row.get("Open", 0) or 0)
                high = float(row.get("High", 0) or 0)
                low = float(row.get("Low", 0) or 0)
                volume = int(float(row.get("Volume", 0) or 0))

            if not open_price or open_price == 0:
                open_price = prev_close
            if not high or high == 0:
                high = max(last_price, open_price)
            if not low or low == 0:
                low = min(last_price, open_price)

            change = round(last_price - prev_close, 4)
            change_pct = round((last_price - prev_close) / prev_close * 100, 2) if prev_close else 0.0

            return {
                "price": last_price,
                "change": change,
                "change_pct": change_pct,
                "open": open_price,
                "high": high,
                "low": low,
                "prev_close": prev_close,
                "volume": volume,
                "timestamp": now_iso(),
                "provider_symbol": yf_symbol,
                "source": "yahoo_futures",
            }
        except Exception:
            logger.warning("api_ninjas: yfinance error for %s", yf_symbol)
            return None

    def get_status(self) -> ProviderStatus:
        return self._status
