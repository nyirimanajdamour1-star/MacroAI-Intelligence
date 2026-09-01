"""Currencies route — per-currency scores, factors, and strength history."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from backend.database.connection import query_all, query_one
from backend.ai.scoring_engine import compute_all_scores

router = APIRouter()


@router.get("/api/currencies")
async def currencies() -> list[dict]:
    compute_all_scores()
    rows = query_all("SELECT code, name, flag, score, ai_rating, confidence, trend, momentum, summary, last_update FROM currencies ORDER BY score DESC")
    for row in rows:
        history = query_all("SELECT timestamp as date, score FROM currency_strength_history WHERE code = ? ORDER BY timestamp DESC LIMIT 24", (row["code"],))
        row["history"] = list(reversed(history))
    return rows


@router.get("/api/currencies/{code}")
async def currency_detail(code: str) -> dict:
    row = query_one("SELECT * FROM currencies WHERE code = ?", (code,))
    if not row:
        raise HTTPException(status_code=404, detail="Currency not found")
    history = query_all("SELECT timestamp as date, score FROM currency_strength_history WHERE code = ? ORDER BY timestamp DESC LIMIT 24", (code,))
    row["history"] = list(reversed(history))
    return row
