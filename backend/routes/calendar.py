"""Calendar route — economic calendar events."""
from __future__ import annotations

from fastapi import APIRouter, Query

from backend.database.connection import query_all

router = APIRouter()


@router.get("/api/calendar")
async def calendar(limit: int = Query(50, ge=1, le=200)) -> list[dict]:
    return query_all(
        "SELECT id, timestamp, country, event, importance, actual, forecast, previous, source FROM economic_calendar ORDER BY timestamp ASC LIMIT ?",
        (limit,),
    )
