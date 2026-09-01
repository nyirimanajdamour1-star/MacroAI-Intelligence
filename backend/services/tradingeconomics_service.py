"""Trading Economics service.

Fetches calendar events and per-country macro indicators (GDP, Inflation,
Unemployment, Manufacturing) plus central bank data for ECB, BOE, BOJ, BOC,
RBA, RBNZ, SNB.

When TRADINGECONOMICS_TOKEN is not set, generates realistic fallback data.
"""
from __future__ import annotations

import logging
import math
from datetime import datetime, timezone, timedelta
from typing import Any

from backend.database.connection import execute
from backend.services.base_service import BaseDataService

logger = logging.getLogger("macroai.services.te")

COUNTRIES = ["US", "EU", "GB", "JP", "CA", "AU", "NZ", "CH"]

COUNTRY_INDICATORS = {
    "GDP": {"unit": "% QoQ", "base": {"US": 2.8, "EU": 0.4, "GB": 0.2, "JP": 0.5, "CA": 0.3, "AU": 0.3, "NZ": 0.2, "CH": 0.4}},
    "Inflation": {"unit": "% YoY", "base": {"US": 3.0, "EU": 2.4, "GB": 2.0, "JP": 2.8, "CA": 2.9, "AU": 3.6, "NZ": 4.0, "CH": 1.2}},
    "Unemployment": {"unit": "%", "base": {"US": 4.1, "EU": 6.3, "GB": 4.4, "JP": 2.6, "CA": 6.4, "AU": 4.1, "NZ": 4.8, "CH": 2.5}},
    "Manufacturing": {"unit": "index", "base": {"US": 48.7, "EU": 45.8, "GB": 47.5, "JP": 49.0, "CA": 47.2, "AU": 49.4, "NZ": 48.1, "CH": 49.3}},
}

CENTRAL_BANKS = [
    {"code": "FED", "name": "Federal Reserve", "country": "US", "governor": "Jerome Powell", "rate": 5.5, "rate_name": "FED Funds Rate", "stance": "Hawkish Hold", "next_meeting": "2026-09-17", "last_change": "2023-07-26", "summary": "The Fed holds rates at a 23-year high, balancing sticky core inflation against a gradually cooling labor market. Powell has signaled that the next move is likely a cut, but not before confidence that inflation is sustainably toward 2%."},
    {"code": "ECB", "name": "European Central Bank", "country": "EU", "governor": "Christine Lagarde", "rate": 3.75, "rate_name": "Deposit Facility Rate", "stance": "Easing", "next_meeting": "2026-09-12", "last_change": "2024-06-12", "summary": "The ECB began its easing cycle in June 2024, cutting the deposit rate from 4.0%. Lagarde has signaled a data-dependent path, with markets pricing further cuts as eurozone inflation approaches target."},
    {"code": "BOE", "name": "Bank of England", "country": "GB", "governor": "Andrew Bailey", "rate": 5.0, "rate_name": "Bank Rate", "stance": "Hawkish Hold", "next_meeting": "2026-09-19", "last_change": "2023-08-03", "summary": "The BOE held at 5.0% after a first cut in August 2024. Bailey faces sticky services inflation and a tight labor market, keeping the MPC cautious about the pace of further easing."},
    {"code": "BOJ", "name": "Bank of Japan", "country": "JP", "governor": "Kazuo Ueda", "rate": 0.25, "rate_name": "Policy Rate", "stance": "Tightening", "next_meeting": "2026-09-20", "last_change": "2024-07-31", "summary": "The BOJ raised rates to 0.25% in July 2024, continuing its historic exit from negative rates. Ueda has signaled a gradual normalization path, with yen weakness and inflation above target supporting further tightening."},
    {"code": "BOC", "name": "Bank of Canada", "country": "CA", "governor": "Tiff Macklem", "rate": 4.5, "rate_name": "Overnight Rate", "stance": "Easing", "next_meeting": "2026-09-04", "last_change": "2024-07-24", "summary": "The BOC cut to 4.5% in July 2024, becoming the first G7 central bank to ease in this cycle. Macklem has signaled a measured easing path as Canadian inflation falls toward target."},
    {"code": "RBA", "name": "Reserve Bank of Australia", "country": "AU", "governor": "Michele Bullock", "rate": 4.35, "rate_name": "Cash Rate", "stance": "Hawkish Hold", "next_meeting": "2026-09-24", "last_change": "2023-11-07", "summary": "The RBA holds at 4.35%, with Bullock emphasizing that inflation remains too high and that a rate cut is not imminent. The RBA is the most hawkish among G10 central banks."},
    {"code": "RBNZ", "name": "Reserve Bank of New Zealand", "country": "NZ", "governor": "Adrian Orr", "rate": 5.25, "rate_name": "Official Cash Rate", "stance": "Hawkish Hold", "next_meeting": "2026-10-09", "last_change": "2023-05-24", "summary": "The RBNZ holds at 5.25% but has signaled that a cut is likely in 2026 as inflation cools. Orr has shifted from hawkish to a more balanced stance as growth slows."},
    {"code": "SNB", "name": "Swiss National Bank", "country": "CH", "governor": "Thomas Jordan", "rate": 1.25, "rate_name": "Policy Rate", "stance": "Easing", "next_meeting": "2026-09-26", "last_change": "2024-06-20", "summary": "The SNB cut to 1.25% in June 2024, its second cut of the year. Jordan has signaled further easing is likely as Swiss inflation remains well below target and the franc stays strong."},
]

EVENT_TEMPLATES = [
    ("CPI Release", "High"),
    ("GDP Release", "High"),
    ("Interest Rate Decision", "High"),
    ("Unemployment Rate", "Medium"),
    ("Manufacturing PMI", "Medium"),
    ("Retail Sales", "Medium"),
    ("Trade Balance", "Low"),
    ("Central Bank Speech", "Medium"),
]


class TradingEconomicsService(BaseDataService):
    async def fetch_indicators(self) -> list[dict[str, Any]]:
        rows: list[dict[str, Any]] = []
        for indicator, meta in COUNTRY_INDICATORS.items():
            for country in COUNTRIES:
                value = await self._fetch_indicator(country, indicator, meta)
                rows.append({"country": country, "code": country, "name": indicator, "value": value, "unit": meta["unit"], "source": "TradingEconomics"})
                self._upsert_indicator(country, country, indicator, value, meta["unit"])
        return rows

    async def _fetch_indicator(self, country: str, indicator: str, meta: dict) -> float:
        token = self.settings.tradingeconomics_token
        base = meta["base"][country]
        if not token:
            return self._seed_value(hash(country + indicator) % 100, base, base * 0.05)

        url = f"https://api.tradingeconomics.com/country/{country}/{indicator.lower().replace(' ', '-')}"
        params = {"c": token, "format": "json"}
        data = await self._get_json(url, params=params)
        if data and isinstance(data, list) and data:
            try:
                return float(data[0].get("LatestValue", data[0].get("Value", base)))
            except (ValueError, KeyError, TypeError):
                pass
        return self._seed_value(hash(country + indicator) % 100, base, base * 0.05)

    async def fetch_calendar(self) -> list[dict[str, Any]]:
        token = self.settings.tradingeconomics_token
        events: list[dict[str, Any]] = []
        now = datetime.now(timezone.utc)

        if token:
            url = "https://api.tradingeconomics.com/calendar"
            params = {"c": token, "format": "json"}
            data = await self._get_json(url, params=params)
            if data and isinstance(data, list):
                for ev in data[:50]:
                    events.append({
                        "timestamp": ev.get("date", now.isoformat()),
                        "country": ev.get("country", "US"),
                        "event": ev.get("event", "Economic Event"),
                        "importance": ev.get("importance", "Medium"),
                        "actual": ev.get("actual"),
                        "forecast": ev.get("forecast"),
                        "previous": ev.get("previous"),
                        "source": "TradingEconomics",
                    })

        if not events:
            for i in range(20):
                country = COUNTRIES[i % len(COUNTRIES)]
                event_name, importance = EVENT_TEMPLATES[i % len(EVENT_TEMPLATES)]
                event_time = now + timedelta(hours=i * 6 - 24)
                forecast = round(self._seed_value(i, 2.5, 0.5), 2)
                previous = round(self._seed_value(i + 1, 2.5, 0.5), 2)
                actual = round(self._seed_value(i + 2, 2.5, 0.5), 2) if event_time < now else None
                events.append({
                    "timestamp": event_time.isoformat(),
                    "country": country,
                    "event": event_name,
                    "importance": importance,
                    "actual": actual,
                    "forecast": forecast,
                    "previous": previous,
                    "source": "fallback",
                })

        for ev in events:
            self._upsert_calendar(ev)
        return events

    async def fetch_central_banks(self) -> list[dict[str, Any]]:
        token = self.settings.tradingeconomics_token
        banks = CENTRAL_BANKS

        if token:
            url = "https://api.tradingeconomics.com/centralbanks"
            params = {"c": token, "format": "json"}
            data = await self._get_json(url, params=params)
            if data and isinstance(data, list):
                for i, bank in enumerate(banks):
                    match = next((b for b in data if b.get("country", "").lower() in bank["country"].lower()), None)
                    if match:
                        try:
                            banks[i] = {**bank, "rate": float(match.get("rate", bank["rate"])), "stance": match.get("stance", bank["stance"])}
                        except (ValueError, TypeError):
                            pass

        for bank in banks:
            self._upsert_central_bank(bank)
        return banks

    @staticmethod
    def _upsert_indicator(country: str, code: str, name: str, value: float, unit: str) -> None:
        execute(
            """
            INSERT INTO macro_indicators (country, code, name, value, unit, source, timestamp)
            VALUES (?, ?, ?, ?, ?, 'TradingEconomics', datetime('now'))
            ON CONFLICT(country, code, name) DO UPDATE SET
                value=excluded.value, timestamp=datetime('now')
            """,
            (country, code, name, value, unit),
        )

    @staticmethod
    def _upsert_calendar(ev: dict) -> None:
        execute(
            """
            INSERT INTO economic_calendar (timestamp, country, event, importance, actual, forecast, previous, source, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
            """,
            (ev["timestamp"], ev["country"], ev["event"], ev["importance"], ev.get("actual"), ev.get("forecast"), ev.get("previous"), ev.get("source", "fallback")),
        )

    @staticmethod
    def _upsert_central_bank(bank: dict) -> None:
        execute(
            """
            INSERT INTO central_banks (code, name, country, governor, rate, rate_name, stance, next_meeting, last_change, summary, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
            ON CONFLICT(code) DO UPDATE SET
                rate=excluded.rate, stance=excluded.stance, next_meeting=excluded.next_meeting, summary=excluded.summary, updated_at=datetime('now')
            """,
            (bank["code"], bank["name"], bank["country"], bank["governor"], bank["rate"], bank["rate_name"], bank["stance"], bank["next_meeting"], bank["last_change"], bank["summary"]),
        )
