"""Global risk route — risk gauge and sentiment data."""
from __future__ import annotations

from fastapi import APIRouter

from backend.database.connection import query_all, query_one

router = APIRouter()


@router.get("/api/global-risk")
async def global_risk() -> dict:
    vix = query_one("SELECT price FROM market_prices WHERE symbol = 'VIX'")
    dxy = query_one("SELECT price FROM market_prices WHERE symbol = 'DXY'")

    vix_val = vix["price"] if vix else 14.5
    dxy_val = dxy["price"] if dxy else 104.2

    risk_score = round(100 - min(100, max(0, (vix_val - 10) * 4)), 0)
    mode = "Risk On" if vix_val < 18 else "Risk Off" if vix_val > 25 else "Neutral"

    return {
        "vix": vix_val,
        "dxy": dxy_val,
        "riskScore": risk_score,
        "mode": mode,
        "description": f"Market sentiment is {mode} with VIX at {vix_val:.1f}. Risk score: {risk_score}/100.",
    }
