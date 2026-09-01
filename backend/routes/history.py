"""History route — currency strength history and trade signal history."""
from __future__ import annotations

from fastapi import APIRouter, Query

from backend.database.connection import query_all

router = APIRouter()


@router.get("/api/history")
async def history(code: str = Query(...), limit: int = Query(48, ge=1, le=500)) -> list[dict]:
    return query_all(
        "SELECT timestamp as date, score FROM currency_strength_history WHERE code = ? ORDER BY timestamp DESC LIMIT ?",
        (code, limit),
    )
