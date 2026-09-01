"""FRED (Federal Reserve Economic Data) service.

Fetches US macro indicators and Treasury bond yields from the FRED API when
FRED_API_KEY is set. Otherwise generates realistic fallback values so the
platform keeps working.

Macro indicators: Interest Rate, Inflation, GDP, Retail Sales, Employment.
Bond yields: 2Y, 5Y, 10Y, 30Y Treasury constant maturity (DGS series).
"""
from __future__ import annotations

import logging
from typing import Any

from backend.database.connection import execute, query_one
from backend.services.base_service import BaseDataService

logger = logging.getLogger("macroai.services.fred")

FRED_SERIES = {
    "Interest Rate": {"series_id": "FEDFUNDS", "unit": "%", "base": 5.5},
    "Inflation": {"series_id": "CPIAUCSL", "unit": "% YoY", "base": 3.0, "transform": "pc1"},
    "GDP": {"series_id": "A191RL1Q225SBEA", "unit": "% QoQ SAAR", "base": 2.8},
    "Retail Sales": {"series_id": "RSAFS", "unit": "% MoM", "base": 0.6, "transform": "pch"},
    "Employment": {"series_id": "UNRATE", "unit": "%", "base": 4.1},
}

# Treasury constant-maturity bond yields. FRED series DGS2/DGS5/DGS10/DGS30.
BOND_SERIES = {
    "2Y": {"series_id": "DGS2", "base": 4.72},
    "5Y": {"series_id": "DGS5", "base": 4.35},
    "10Y": {"series_id": "DGS10", "base": 4.28},
    "30Y": {"series_id": "DGS30", "base": 4.50},
}


class FredService(BaseDataService):
    def __init__(self, settings: Any) -> None:
        super().__init__(settings)
        has_key = bool(settings.fred_api_key)
        logger.info("FRED service initialized — FRED_API_KEY %s", "present, will fetch live data" if has_key else "MISSING, using fallback pseudo-values")

    async def fetch_all(self) -> list[dict[str, Any]]:
        logger.info("FRED fetch_all: starting macro indicators + bond yields")
        rows: list[dict[str, Any]] = []
        for name, meta in FRED_SERIES.items():
            value = await self._fetch_series(name, meta)
            rows.append({"country": "US", "code": "US", "name": name, "value": value, "unit": meta["unit"], "source": "FRED"})
            self._upsert_indicator("US", "US", name, value, meta["unit"])
        return rows

    async def fetch_bonds(self) -> list[dict[str, Any]]:
        """Fetch US Treasury yields and upsert into bond_yields."""
        key = self.settings.fred_api_key
        if not key:
            logger.warning("FRED bonds: FRED_API_KEY is not set — writing fallback values to bond_yields")
        else:
            logger.info("FRED bonds: fetching live Treasury yields (DGS2, DGS5, DGS10, DGS30)")

        rows: list[dict[str, Any]] = []
        for maturity, meta in BOND_SERIES.items():
            value, prev = await self._fetch_bond_series(maturity, meta)
            change = round(value - prev, 4) if prev is not None else 0.0
            self._upsert_bond("US", maturity, value, change)
            rows.append({"country": "US", "maturity": maturity, "value": value, "change": change, "source": "FRED"})
            logger.info("FRED bonds: %s = %.4f%% (prev: %s, change: %s)",
                        maturity, value,
                        f"{prev:.4f}%" if prev is not None else "N/A",
                        f"{change:+.4f}" if prev is not None else "N/A")
        logger.info("FRED bonds: complete — %d maturities updated", len(rows))
        return rows

    async def _fetch_series(self, name: str, meta: dict) -> float:
        key = self.settings.fred_api_key
        if not key:
            return self._seed_value(hash(name) % 100, meta["base"], meta["base"] * 0.04)

        url = "https://api.stlouisfed.org/fred/series/observations"
        params = {
            "series_id": meta["series_id"],
            "api_key": key,
            "file_type": "json",
            "sort_order": "desc",
            "limit": 1,
        }
        if meta.get("transform"):
            params["units"] = meta["transform"]

        data = await self._get_json(url, params=params)
        if data and "observations" in data and data["observations"]:
            try:
                val = float(data["observations"][0]["value"])
                logger.info("FRED macro: %s (%s) = %.4f", name, meta["series_id"], val)
                return val
            except (ValueError, KeyError):
                logger.warning("FRED macro: %s — could not parse response, using fallback", name)
        else:
            logger.warning("FRED macro: %s — no observations returned, using fallback", name)
        return self._seed_value(hash(name) % 100, meta["base"], meta["base"] * 0.04)

    async def _fetch_bond_series(self, maturity: str, meta: dict) -> tuple[float, float | None]:
        """Return (latest_value, previous_value) for a DGS series."""
        key = self.settings.fred_api_key
        if not key:
            v = self._seed_value(hash(maturity) % 100, meta["base"], meta["base"] * 0.03)
            return v, None

        url = "https://api.stlouisfed.org/fred/series/observations"
        params = {
            "series_id": meta["series_id"],
            "api_key": key,
            "file_type": "json",
            "sort_order": "desc",
            "limit": 2,
        }
        data = await self._get_json(url, params=params)
        if data and "observations" in data and data["observations"]:
            try:
                latest = float(data["observations"][0]["value"])
                prev = None
                if len(data["observations"]) > 1:
                    prev = float(data["observations"][1]["value"])
                return latest, prev
            except (ValueError, KeyError):
                logger.warning("FRED bonds: %s (%s) — could not parse response", maturity, meta["series_id"])
        else:
            logger.warning("FRED bonds: %s (%s) — no observations returned", maturity, meta["series_id"])
        v = self._seed_value(hash(maturity) % 100, meta["base"], meta["base"] * 0.03)
        return v, None

    @staticmethod
    def _upsert_indicator(country: str, code: str, name: str, value: float, unit: str) -> None:
        execute(
            """
            INSERT INTO macro_indicators (country, code, name, value, unit, source, timestamp)
            VALUES (?, ?, ?, ?, ?, 'FRED', datetime('now'))
            ON CONFLICT(country, code, name) DO UPDATE SET
                value=excluded.value, unit=excluded.unit, timestamp=datetime('now')
            """,
            (country, code, name, value, unit),
        )

    @staticmethod
    def _upsert_bond(country: str, maturity: str, value: float, change: float) -> None:
        existing = query_one(
            "SELECT value FROM bond_yields WHERE country = ? AND maturity = ?",
            (country, maturity),
        )
        if existing is None:
            execute(
                "INSERT INTO bond_yields (country, maturity, value, change, timestamp) VALUES (?, ?, ?, ?, datetime('now'))",
                (country, maturity, value, change),
            )
        else:
            execute(
                "UPDATE bond_yields SET value = ?, change = ?, timestamp = datetime('now') WHERE country = ? AND maturity = ?",
                (value, change, country, maturity),
            )