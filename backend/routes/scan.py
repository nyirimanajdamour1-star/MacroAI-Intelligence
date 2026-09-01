"""Scan route — cross-asset AI market scanner.

Combines forex trade signals and futures instruments into a single ranked
list of scan results with AI scores, signals, confidence, momentum, ATR,
support/resistance, and risk-reward.
"""
from __future__ import annotations

import json
import math

from fastapi import APIRouter

from backend.database.connection import query_all, query_one
from backend.ai.pair_engine import compute_all_pairs

router = APIRouter()


def _signal_from_score(score: float) -> str:
    if score >= 78:
        return "Strong Buy"
    if score >= 60:
        return "Buy"
    if score >= 42:
        return "Neutral"
    if score >= 28:
        return "Sell"
    return "Strong Sell"


def _vol_from_atr(atr: float) -> str:
    if atr >= 100:
        return "Very High"
    if atr >= 30:
        return "High"
    if atr >= 8:
        return "Medium"
    return "Low"


def _gen_sparkline(base: float, drift: float) -> list[dict]:
    from datetime import datetime, timezone, timedelta
    pts: list[dict] = []
    now = datetime.now(timezone.utc)
    v = base * (1 - drift * 15)
    for i in range(29, -1, -1):
        dt = now - timedelta(days=i)
        noise = math.sin(i * 0.8) * base * 0.004
        v += drift * base * 0.015 + noise
        pts.append({"date": dt.strftime("%m-%d"), "value": round(v, 2)})
    pts[-1]["value"] = round(base, 2)
    return pts


@router.get("/api/scan")
async def scan() -> list[dict]:
    results: list[dict] = []

    # --- Forex pairs from pair engine ---
    pairs = compute_all_pairs()
    for p in pairs:
        price = p.get("price")
        if not price:
            continue
        atr = round(abs(price) * 0.006, 4)
        momentum = round(min(100, abs(p["score_diff"]) * 3 + 30))
        drift = 0.004 if p["signal"] in ("Strong Buy", "Buy") else -0.003 if p["signal"] in ("Strong Sell", "Sell") else 0.001
        results.append({
            "symbol": p["pair"],
            "name": f"{p['base']} / {p['quote']}",
            "asset_class": "Forex",
            "price": price,
            "change_pct": round((p["score_diff"] * 0.01), 2),
            "ai_score": p["pair_score"],
            "signal": p["signal"],
            "confidence": p["confidence"],
            "trend": "up" if p["score_diff"] > 5 else "down" if p["score_diff"] < -5 else "flat",
            "bias": "buy" if p["score_diff"] > 0 else "sell" if p["score_diff"] < 0 else "neutral",
            "momentum": momentum,
            "volume": 0,
            "support": round(price * 0.985, 6),
            "resistance": round(price * 1.015, 6),
            "atr": atr,
            "risk_reward": 2.0 if p["signal"] != "Neutral" else 1.0,
            "catalyst": p["expected_direction"],
            "sparkline": _gen_sparkline(price, drift),
        })

    # --- Futures instruments ---
    futures = query_all(
        "SELECT symbol, name, category, price, change_pct, trend, ai_score, "
        "bias, confidence, support, resistance, atr, volume, history "
        "FROM futures ORDER BY ai_score DESC"
    )
    for f in futures:
        try:
            history = json.loads(f.get("history") or "[]")
        except (json.JSONDecodeError, TypeError):
            history = []
        sparkline = [{"date": h.get("date", "")[:5], "value": h["price"]} for h in history[-30:]] if history else _gen_sparkline(f["price"], 0.002)
        drift = 0.003 if f["trend"] == "up" else -0.002 if f["trend"] == "down" else 0.001
        if not sparkline:
            sparkline = _gen_sparkline(f["price"], drift)
        momentum = round(min(100, f["ai_score"] * 0.9 + 10))
        results.append({
            "symbol": f["symbol"],
            "name": f["name"],
            "asset_class": f["category"],
            "price": f["price"],
            "change_pct": f["change_pct"],
            "ai_score": f["ai_score"],
            "signal": _signal_from_score(f["ai_score"]),
            "confidence": f["confidence"],
            "trend": f["trend"],
            "bias": f["bias"],
            "momentum": momentum,
            "volume": f["volume"],
            "support": f["support"],
            "resistance": f["resistance"],
            "atr": f["atr"],
            "risk_reward": round((f["resistance"] - f["price"]) / max(f["price"] - f["support"], 0.001), 1) if f["bias"] == "buy" else round((f["price"] - f["support"]) / max(f["resistance"] - f["price"], 0.001), 1),
            "catalyst": f"AI score {f['ai_score']:.0f}, {f['bias']} bias with {f['confidence']:.0f}% confidence",
            "sparkline": sparkline,
        })

    # Sort by AI score descending and assign rank
    results.sort(key=lambda r: r["ai_score"], reverse=True)
    for i, r in enumerate(results):
        r["rank"] = i + 1
        r["volatility"] = _vol_from_atr(r["atr"])

    return results
