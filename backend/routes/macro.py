"""Macro data route — per-country macro indicators."""
from __future__ import annotations

from fastapi import APIRouter, Query

from backend.database.connection import query_all

router = APIRouter()


@router.get("/api/macro")
async def macro(country: str = Query("US")) -> list[dict]:
    return query_all(
        "SELECT id, country, code, name, value, unit, previous, source, timestamp FROM macro_indicators WHERE country = ? ORDER BY name",
        (country,),
    )
