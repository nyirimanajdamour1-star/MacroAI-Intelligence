"""Futures route — futures instrument data (indices, metals, energy).

Returns live market data from Twelve Data when the API key is configured,
or cached/seeded data clearly labeled as STALE/OFFLINE when unavailable.
"""
from __future__ import annotations

from fastapi import APIRouter

from backend.services.futures_service import get_all_futures

router = APIRouter()


@router.get("/api/futures")
async def futures() -> list[dict]:
    return get_all_futures()
