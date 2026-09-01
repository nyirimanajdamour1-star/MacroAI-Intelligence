"""Twelve Data provider — real spot Gold price.

Provides live SPOT price for:
  XAUUSD -> XAU/USD (Gold Spot)

Only Gold is handled here. Silver (XAG/USD), WTI, and Brent are handled
by the CommodityPriceApiProvider. Index futures (ES, NQ, YM) are handled
by the YahooFuturesProvider.
"""
from __future__ import annotations

import asyncio
import logging
from typing import Any

import httpx

from backend.services.providers import BaseMarketDataProvider, MarketQuote, ProviderStatus, now_iso

logger = logging.getLogger("macroai.providers.twelvedata")

API_URL = "https://api.twelvedata.com/quote"
RATE_LIMIT_DELAY = 1.0

INSTRUMENTS: dict[str, dict[str, str]] = {
    "XAUUSD": {"provider_symbol": "XAU/USD", "name": "Gold Spot", "category": "Metal", "instrument_type": "SPOT"},
}


class TwelveDataProvider(BaseMarketDataProvider):
    name = "twelvedata"

    def __init__(self, api_key: str) -> None:
        self.api_key = api_key
        self.client = httpx.AsyncClient(timeout=15.0)
        self._status = ProviderStatus(
            name=self.name,
            status="OFFLINE" if not api_key else "OFFLINE",
            instruments=list(INSTRUMENTS.keys()),
        )

    async def aclose(self) -> None:
        await self.client.aclose()

    async def fetch_quotes(self) -> list[MarketQuote]:
        if not self.api_key:
            logger.warning("twelvedata: no API key — skipping")
            self._status.status = "OFFLINE"
            self._status.last_error = "no_api_key"
            return []

        quotes: list[MarketQuote] = []
        any_live = False

        for internal_sym, cfg in INSTRUMENTS.items():
            quote = await self._fetch_one(cfg["provider_symbol"])
            if quote is not None:
                any_live = True
                quotes.append(MarketQuote(
                    symbol=internal_sym,
                    provider_symbol=cfg["provider_symbol"],
                    name=cfg["name"],
                    category=cfg["category"],
                    instrument_type=cfg["instrument_type"],
                    price=quote["price"],
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
                    provider_symbol=cfg["provider_symbol"],
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
            logger.info("twelvedata: live data fetched successfully")
        else:
            self._status.status = "STALE"
            self._status.last_error = "all_requests_failed"
            logger.warning("twelvedata: all requests failed")

        return quotes

    async def _fetch_one(self, td_symbol: str) -> dict[str, Any] | None:
        try:
            resp = await self.client.get(API_URL, params={
                "symbol": td_symbol,
                "apikey": self.api_key,
            })
            resp.raise_for_status()
            data = resp.json()

            if data.get("status") == "error":
                msg = data.get("message", "unknown error")
                if "upgrade" in msg.lower() or "plan" in msg.lower():
                    logger.warning("twelvedata: %s requires a paid plan — skipping", td_symbol)
                else:
                    logger.warning("twelvedata: API error for %s", td_symbol)
                return None

            price_str = data.get("close")
            if not price_str:
                logger.warning("twelvedata: no price for %s", td_symbol)
                return None

            price = float(price_str)
            prev = float(data.get("previous_close") or 0)
            change = float(data.get("change") or (price - prev if prev else 0))
            change_pct = float(data.get("percent_change") or ((price - prev) / prev * 100 if prev else 0))

            return {
                "price": price,
                "open": float(data.get("open") or 0),
                "high": float(data.get("high") or 0),
                "low": float(data.get("low") or 0),
                "prev_close": prev,
                "volume": int(float(data.get("volume") or 0)),
                "change": change,
                "change_pct": change_pct,
                "timestamp": now_iso(),
            }
        except httpx.HTTPStatusError as exc:
            logger.warning("twelvedata: HTTP %s for %s", exc.response.status_code, td_symbol)
            return None
        except httpx.HTTPError:
            logger.warning("twelvedata: connection error for %s", td_symbol)
            return None
        except Exception:
            logger.warning("twelvedata: unexpected error for %s", td_symbol)
            return None

    def get_status(self) -> ProviderStatus:
        return self._status
