"""Market data service.

Fetches DXY, Gold, Silver, Oil, Bitcoin, Ethereum, NASDAQ, S&P500, VIX, US10Y,
US2Y from Alpha Vantage when a key is set. Otherwise generates realistic
fallback prices.
"""
from __future__ import annotations

import logging
from typing import Any

from backend.database.connection import execute
from backend.services.base_service import BaseDataService

logger = logging.getLogger("macroai.services.market")

MARKETS = [
    {"symbol": "DXY", "name": "US Dollar Index", "category": "forex", "base": 104.2, "vol": 0.15},
    {"symbol": "XAU", "name": "Gold", "category": "commodity", "base": 2380.0, "vol": 8.0},
    {"symbol": "XAG", "name": "Silver", "category": "commodity", "base": 28.5, "vol": 0.4},
    {"symbol": "WTI", "name": "Crude Oil WTI", "category": "commodity", "base": 78.0, "vol": 1.2},
    {"symbol": "BTC", "name": "Bitcoin", "category": "crypto", "base": 67000.0, "vol": 800.0},
    {"symbol": "ETH", "name": "Ethereum", "category": "crypto", "base": 3500.0, "vol": 60.0},
    {"symbol": "NDX", "name": "NASDAQ 100", "category": "index", "base": 20200.0, "vol": 80.0},
    {"symbol": "SPX", "name": "S&P 500", "category": "index", "base": 5580.0, "vol": 18.0},
    {"symbol": "VIX", "name": "Volatility Index", "category": "index", "base": 14.5, "vol": 1.2},
    {"symbol": "US10Y", "name": "US 10Y Yield", "category": "bond", "base": 4.28, "vol": 0.04},
    {"symbol": "US2Y", "name": "US 2Y Yield", "category": "bond", "base": 4.72, "vol": 0.05},
]


class MarketService(BaseDataService):
    async def fetch_all(self) -> list[dict[str, Any]]:
        rows: list[dict[str, Any]] = []
        for m in MARKETS:
            price, prev = await self._fetch_symbol(m)
            change = round(price - prev, 4)
            change_pct = round(((price - prev) / prev) * 100, 2) if prev else 0.0
            rows.append({"symbol": m["symbol"], "name": m["name"], "category": m["category"], "price": price, "change": change, "change_pct": change_pct})
            self._upsert(m["symbol"], m["name"], m["category"], price, change, change_pct)
            if m["category"] == "bond":
                self._upsert_bond(m["symbol"], price, change)
        return rows

    async def _fetch_symbol(self, m: dict) -> tuple[float, float]:
        key = self.settings.alpha_vantage_key
        if not key:
            price = self._seed_value(hash(m["symbol"]) % 100, m["base"], m["vol"])
            prev = self._seed_value(hash(m["symbol"]) % 100 + 1, m["base"], m["vol"])
            return price, prev

        url = "https://www.alphavantage.co/query"
        params = {"function": "GLOBAL_QUOTE", "symbol": m["symbol"], "apikey": key}
        data = await self._get_json(url, params=params)
        if data and "Global Quote" in data:
            q = data["Global Quote"]
            try:
                price = float(q.get("05. price", m["base"]))
                prev = float(q.get("08. previous close", price))
                return price, prev
            except (ValueError, KeyError):
                pass
        price = self._seed_value(hash(m["symbol"]) % 100, m["base"], m["vol"])
        prev = self._seed_value(hash(m["symbol"]) % 100 + 1, m["base"], m["vol"])
        return price, prev

    @staticmethod
    def _upsert(symbol: str, name: str, category: str, price: float, change: float, change_pct: float) -> None:
        execute(
            """
            INSERT INTO market_prices (symbol, name, category, price, change, change_pct, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
            ON CONFLICT(symbol) DO UPDATE SET
                price=excluded.price, change=excluded.change, change_pct=excluded.change_pct, timestamp=datetime('now')
            """,
            (symbol, name, category, price, change, change_pct),
        )

    @staticmethod
    def _upsert_bond(symbol: str, value: float, change: float) -> None:
        country = "US"
        maturity = "10Y" if "10Y" in symbol else "2Y"
        execute(
            """
            INSERT INTO bond_yields (country, maturity, value, change, timestamp)
            VALUES (?, ?, ?, ?, datetime('now'))
            ON CONFLICT(country, maturity) DO UPDATE SET
                value=excluded.value, change=excluded.change, timestamp=datetime('now')
            """,
            (country, maturity, value, change),
        )
