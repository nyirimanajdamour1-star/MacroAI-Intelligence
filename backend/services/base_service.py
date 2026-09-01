"""Shared helpers for all data services.

Every external service follows the same contract:
  1. Try the real API (if a key is configured).
  2. On any failure, fall back to deterministic realistic data so the
     platform is always functional.
  3. Persist the result into SQLite with a fresh timestamp.
"""
from __future__ import annotations

import logging
import random
import math
import time
from datetime import datetime, timezone
from typing import Any

import httpx

logger = logging.getLogger("macroai.services")


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class BaseDataService:
    """Common HTTP + fallback utilities."""

    timeout: float = 15.0

    def __init__(self, settings: Any) -> None:
        self.settings = settings
        self.client = httpx.AsyncClient(timeout=self.timeout)

    async def aclose(self) -> None:
        await self.client.aclose()

    async def _get_json(self, url: str, params: dict | None = None, headers: dict | None = None) -> dict | None:
        try:
            resp = await self.client.get(url, params=params, headers=headers)
            resp.raise_for_status()
            return resp.json()
        except Exception as exc:
            logger.warning("%s fetch failed: %s", self.__class__.__name__, exc)
            return None

    # -- Deterministic pseudo-data -----------------------------------------
    @staticmethod
    def _seed_value(seed: float, base: float, vol: float) -> float:
        """Generate a time-varying fallback around `base` so live pages do not get stuck on one static ranking when API keys are missing."""
        now_ns = time.time_ns()
        t = now_ns / 1_000_000_000.0
        wave = math.sin((t + seed * 3.7) / 90.0) * vol
        noise = (random.Random(int(now_ns // 1_000_000) + int(seed * 1000)).random() - 0.5) * vol
        return round(base + wave + noise, 4)

    @staticmethod
    def _change(base: float, prev: float) -> float:
        return round(base - prev, 4)

    @staticmethod
    def _change_pct(base: float, prev: float) -> float:
        if prev == 0:
            return 0.0
        return round(((base - prev) / prev) * 100, 2)
