"""Trades route — trade signals history."""
from __future__ import annotations

from fastapi import APIRouter, Query

from backend.database.connection import query_all

router = APIRouter()


@router.get("/api/trades")
async def trades(limit: int = Query(30, ge=1, le=200)) -> list[dict]:
    return query_all(
        "SELECT id, pair, timestamp, signal, confidence, risk, expected_direction, score_diff, entry, stop_loss, take_profit_1, take_profit_2, risk_reward, holding_period FROM trade_signals ORDER BY timestamp DESC LIMIT ?",
        (limit,),
    )
