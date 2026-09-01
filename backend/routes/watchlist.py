"""Watchlist route — user watchlist management."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from backend.database.connection import query_all, query_one, execute
from backend.models.schemas import WatchlistItem, WatchlistRemove

router = APIRouter()


@router.get("/api/watchlist")
async def get_watchlist(user_token: str = Query("default")) -> list[dict]:
    items = query_all("SELECT id, symbol, kind, added_at FROM watchlist WHERE user_token = ? ORDER BY added_at DESC", (user_token,))
    for item in items:
        if item["kind"] == "pair":
            fx = query_one("SELECT price, change, change_pct FROM forex_quotes WHERE symbol = ?", (item["symbol"],))
            if fx:
                item.update(fx)
    return items


@router.post("/api/watchlist")
async def add_to_watchlist(payload: WatchlistItem) -> dict:
    if not payload.symbol:
        raise HTTPException(status_code=400, detail="symbol required")
    execute(
        "INSERT OR IGNORE INTO watchlist (user_token, symbol, kind) VALUES (?, ?, ?)",
        (payload.user_token, payload.symbol, payload.kind),
    )
    return {"status": "added", "symbol": payload.symbol}


@router.delete("/api/watchlist")
async def remove_from_watchlist(payload: WatchlistRemove) -> dict:
    execute("DELETE FROM watchlist WHERE user_token = ? AND symbol = ?", (payload.user_token, payload.symbol))
    return {"status": "removed", "symbol": payload.symbol}
