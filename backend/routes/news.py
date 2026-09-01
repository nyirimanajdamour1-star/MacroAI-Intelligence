"""News route — macroeconomic news feed."""
from __future__ import annotations

from fastapi import APIRouter, Query

from backend.database.connection import query_all

router = APIRouter()


@router.get("/api/news")
async def news(limit: int = Query(30, ge=1, le=100)) -> list[dict]:
    return query_all(
        "SELECT id, timestamp, source, headline, summary, url, sentiment, sentiment_score, currencies FROM news ORDER BY timestamp DESC LIMIT ?",
        (limit,),
    )
