"""Yahoo Finance futures provider — free delayed futures data.

Provides delayed (typically 10-15 min) futures data via yfinance for:
  SPX500 -> ES=F (S&P 500 E-mini Futures)
  US100  -> NQ=F (Nasdaq-100 E-mini Futures)
  US30   -> YM=F (Dow Jones E-mini Futures)

This data is DELAYED and UNOFFICIAL — it is not licensed CME data.
It is suitable for a free prototype but should be replaced by a
licensed CME futures provider (e.g. Polygon.io Futures) for production.

The provider abstraction (BaseMarketDataProvider) means this provider
can be swapped out without changing the frontend or the /api/futures
response shape.
"""
from __future__ import annotations

import logging
from typing import Any

import yfinance as yf

from backend.services.providers import BaseMarketDataProvider, MarketQuote, ProviderStatus, now_iso

logger = logging.getLogger("macroai.providers.yahoo_futures")

INSTRUMENTS: dict[str, dict[str, str]] = {
    "SPX500": {"provider_symbol": "ES=F", "name": "S&P 500 E-mini Futures",  "category": "Index",  "instrument_type": "FUTURE"},
    "US100":  {"provider_symbol": "NQ=F", "name": "Nasdaq-100 E-mini Futures", "category": "Index",  "instrument_type": "FUTURE"},
    "US30":   {"provider_symbol": "YM=F", "name": "Dow Jones E-mini Futures",  "category": "Index",  "instrument_type": "FUTURE"},
}


class YahooFuturesProvider(BaseMarketDataProvider):
    """Fetches delayed futures data from Yahoo Finance via yfinance."""

    name = "yahoo_futures"

    def __init__(self) -> None:
        self._status = ProviderStatus(
            name=self.name,
            status="OFFLINE",
            instruments=list(INSTRUMENTS.keys()),
        )

    async def aclose(self) -> None:
        pass

    async def fetch_quotes(self) -> list[MarketQuote]:
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
                    data_status="DELAYED",
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

        if any_live:
            self._status.status = "LIVE"
            self._status.last_success = now_iso()
            self._status.last_error = None
            logger.info("yahoo_futures: delayed futures data fetched successfully")
        else:
            self._status.status = "STALE"
            self._status.last_error = "all_requests_failed"
            logger.warning("yahoo_futures: all requests failed")

        return quotes

    async def _fetch_one(self, yf_symbol: str) -> dict[str, Any] | None:
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
                    logger.warning("yahoo_futures: no price for %s", yf_symbol)
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
                "close": last_price,
                "open": open_price,
                "high": high,
                "low": low,
                "prev_close": prev_close,
                "volume": volume,
                "change": change,
                "change_pct": change_pct,
                "timestamp": now_iso(),
            }
        except Exception:
            logger.warning("yahoo_futures: fetch error for %s", yf_symbol)
            return None

    def get_status(self) -> ProviderStatus:
        return self._status
