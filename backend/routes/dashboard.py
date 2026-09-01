"""Dashboard route — aggregated overview data for the main dashboard."""
from __future__ import annotations

from fastapi import APIRouter

from backend.database.connection import query_all, query_one
from backend.ai.scoring_engine import compute_all_scores

router = APIRouter()


@router.get("/api/dashboard")
async def dashboard() -> dict:
    scores = compute_all_scores()
    currencies = query_all("SELECT code, name, flag, score, ai_rating, confidence, trend, momentum, summary, last_update FROM currencies ORDER BY score DESC")

    markets = query_all("SELECT symbol, name, category, price, change, change_pct FROM market_prices ORDER BY category, symbol")
    vix = query_one("SELECT price FROM market_prices WHERE symbol = 'VIX'")
    dxy = query_one("SELECT price FROM market_prices WHERE symbol = 'DXY'")

    top_pairs = query_all("SELECT pair, signal, confidence, risk, expected_direction, score_diff FROM trade_signals ORDER BY abs(score_diff) DESC LIMIT 6")

    news = query_all("SELECT id, timestamp, source, headline, summary, sentiment, sentiment_score, currencies FROM news ORDER BY timestamp DESC LIMIT 8")

    return {
        "currencies": currencies,
        "scores": scores,
        "markets": markets,
        "vix": vix["price"] if vix else 14.5,
        "dxy": dxy["price"] if dxy else 104.2,
        "topPairs": top_pairs,
        "news": news,
    }
