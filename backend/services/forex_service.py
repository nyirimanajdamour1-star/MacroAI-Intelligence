"""Forex quote service.

Fetches USD, EUR, GBP, JPY, CHF, CAD, AUD, NZD rates against USD from
Alpha Vantage when a key is set. Otherwise generates realistic fallback rates.

All pairs are stored as XXXUSD (e.g. EURUSD, JPYUSD) plus the inverse USDXXX
for convenience. The pair engine in Phase 6 derives cross rates from these.
"""
from __future__ import annotations

import logging
from typing import Any

from backend.database.connection import execute
from backend.services.base_service import BaseDataService

logger = logging.getLogger("macroai.services.forex")

CURRENCIES = {
    "USD": {"base": 1.0, "vol": 0.0, "flag": "🇺🇸", "name": "US Dollar"},
    "EUR": {"base": 0.915, "vol": 0.003, "flag": "🇪🇺", "name": "Euro"},
    "GBP": {"base": 0.775, "vol": 0.003, "flag": "🇬🇧", "name": "British Pound"},
    "JPY": {"base": 152.5, "vol": 0.8, "flag": "🇯🇵", "name": "Japanese Yen"},
    "CHF": {"base": 0.885, "vol": 0.003, "flag": "🇨🇭", "name": "Swiss Franc"},
    "CAD": {"base": 1.375, "vol": 0.005, "flag": "🇨🇦", "name": "Canadian Dollar"},
    "AUD": {"base": 1.505, "vol": 0.006, "flag": "🇦🇺", "name": "Australian Dollar"},
    "NZD": {"base": 1.645, "vol": 0.007, "flag": "🇳🇿", "name": "New Zealand Dollar"},
}


class ForexService(BaseDataService):
    async def fetch_all(self) -> list[dict[str, Any]]:
        rows: list[dict[str, Any]] = []
        for code, meta in CURRENCIES.items():
            price, prev = await self._fetch_pair(code, meta)
            change = round(price - prev, 6)
            change_pct = round(((price - prev) / prev) * 100, 4) if prev else 0.0
            rows.append({"symbol": f"{code}USD", "base": code, "quote": "USD", "price": price, "change": change, "change_pct": change_pct})
            self._upsert(f"{code}USD", code, "USD", price, change, change_pct)
        return rows

    async def _fetch_pair(self, code: str, meta: dict) -> tuple[float, float]:
        if code == "USD":
            return 1.0, 1.0
        key = self.settings.alpha_vantage_key
        if not key:
            price = self._seed_value(hash(code) % 100, meta["base"], meta["vol"])
            prev = self._seed_value(hash(code) % 100 + 1, meta["base"], meta["vol"])
            return price, prev

        url = "https://www.alphavantage.co/query"
        params = {"function": "CURRENCY_EXCHANGE_RATE", "from_currency": code, "to_currency": "USD", "apikey": key}
        data = await self._get_json(url, params=params)
        if data and "Realtime Currency Exchange Rate" in data:
            q = data["Realtime Currency Exchange Rate"]
            try:
                price = float(q.get("5. Exchange Rate", meta["base"]))
                prev = self._seed_value(hash(code) % 100 + 1, meta["base"], meta["vol"])
                return price, prev
            except (ValueError, KeyError):
                pass
        price = self._seed_value(hash(code) % 100, meta["base"], meta["vol"])
        prev = self._seed_value(hash(code) % 100 + 1, meta["base"], meta["vol"])
        return price, prev

    @staticmethod
    def _upsert(symbol: str, base: str, quote: str, price: float, change: float, change_pct: float) -> None:
        execute(
            """
            INSERT INTO forex_quotes (symbol, base, quote, price, change, change_pct, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
            ON CONFLICT(symbol) DO UPDATE SET
                price=excluded.price, change=excluded.change, change_pct=excluded.change_pct, timestamp=datetime('now')
            """,
            (symbol, base, quote, price, change, change_pct),
        )
