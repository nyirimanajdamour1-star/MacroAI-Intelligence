"""Macro scoring engine.

Computes a 0-100 score for every currency based on weighted macro factors.
Weights are configurable via the WEIGHTS dict. The engine reads the latest
indicator values from SQLite, normalizes each factor to a 0-100 bullishness
score, applies its weight, and aggregates.

Output per currency:
  overall_score, bullish_factors, bearish_factors, confidence,
  trend, momentum, factor_breakdown
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

from backend.database.connection import query_all, query_one, execute

logger = logging.getLogger("macroai.scoring")

# Configurable weights (sum = 100). Higher weight = more influence on score.
WEIGHTS: dict[str, float] = {
    "Interest Rate": 14,
    "Inflation": 12,
    "GDP": 10,
    "Employment": 8,
    "Retail Sales": 7,
    "Manufacturing": 7,
    "Trade Balance": 6,
    "Bond Yield": 8,
    "Risk Sentiment": 6,
    "Dollar Strength": 5,
    "Commodity Exposure": 5,
    "Safe Haven Demand": 5,
    "Growth": 4,
    "Momentum": 3,
}

# Base profiles per currency for factors not directly in the indicators table.
# These are priors — the engine blends them with live indicator values.
CURRENCY_PROFILES = {
    "USD": {"commodity": -0.2, "safe_haven": 0.8, "dollar_strength": 1.0},
    "EUR": {"commodity": -0.1, "safe_haven": 0.3, "dollar_strength": -0.5},
    "GBP": {"commodity": -0.1, "safe_haven": 0.2, "dollar_strength": -0.4},
    "JPY": {"commodity": -0.3, "safe_haven": 0.9, "dollar_strength": -0.6},
    "CHF": {"commodity": -0.2, "safe_haven": 0.95, "dollar_strength": -0.5},
    "CAD": {"commodity": 0.6, "safe_haven": 0.1, "dollar_strength": -0.3},
    "AUD": {"commodity": 0.7, "safe_haven": -0.2, "dollar_strength": -0.4},
    "NZD": {"commodity": 0.5, "safe_haven": -0.1, "dollar_strength": -0.4},
}

CURRENCY_META = {
    "USD": {"name": "US Dollar", "flag": "🇺🇸"},
    "EUR": {"name": "Euro", "flag": "🇪🇺"},
    "GBP": {"name": "British Pound", "flag": "🇬🇧"},
    "JPY": {"name": "Japanese Yen", "flag": "🇯🇵"},
    "CHF": {"name": "Swiss Franc", "flag": "🇨🇭"},
    "CAD": {"name": "Canadian Dollar", "flag": "🇨🇦"},
    "AUD": {"name": "Australian Dollar", "flag": "🇦🇺"},
    "NZD": {"name": "New Zealand Dollar", "flag": "🇳🇿"},
}

COUNTRY_MAP = {"USD": "US", "EUR": "EU", "GBP": "GB", "JPY": "JP", "CHF": "CH", "CAD": "CA", "AUD": "AU", "NZD": "NZ"}


def _get_indicator(country: str, name: str) -> float | None:
    row = query_one(
        "SELECT value FROM macro_indicators WHERE country = ? AND name = ? ORDER BY timestamp DESC LIMIT 1",
        (country, name),
    )
    return row["value"] if row else None


def _normalize(factor: str, value: float | None, currency: str) -> float:
    """Normalize a raw indicator value to a 0-100 bullishness score.

    50 = neutral. Higher = more bullish for the currency.
    """
    country = COUNTRY_MAP.get(currency, "US")
    if value is None:
        return 50.0

    if factor == "Interest Rate":
        # Higher rates = more bullish (carry attraction), but capped.
        return min(100, 40 + value * 8)
    if factor == "Inflation":
        # Moderate inflation (2-3%) is bullish; too high or deflation is bearish.
        if value <= 0:
            return 20
        return max(10, min(90, 100 - abs(value - 2.5) * 15))
    if factor == "GDP":
        # Higher growth = bullish.
        return min(100, 35 + value * 15)
    if factor == "Employment":
        # Lower unemployment = bullish, but very low can overheat.
        return max(20, min(90, 100 - value * 8))
    if factor == "Retail Sales":
        # Positive = bullish.
        return min(100, 50 + value * 20)
    if factor == "Manufacturing":
        # PMI: above 50 = expansion = bullish.
        return min(100, max(10, value * 1.8))
    if factor == "Trade Balance":
        # Surplus = bullish (scaled roughly).
        return min(100, max(10, 50 + value * 2))
    if factor == "Bond Yield":
        # Higher yield = bullish for currency.
        return min(100, 40 + value * 10)
    return 50.0


def _score_currency(currency: str, sentiment: str, dxy: float, momentum_val: float) -> dict[str, Any]:
    profile = CURRENCY_PROFILES.get(currency, {"commodity": 0, "safe_haven": 0, "dollar_strength": 0})
    country = COUNTRY_MAP.get(currency, "US")

    factors: dict[str, dict[str, Any]] = {}

    # Direct macro indicators
    for name in ["Interest Rate", "Inflation", "GDP", "Employment", "Retail Sales", "Manufacturing", "Trade Balance", "Bond Yield"]:
        raw = _get_indicator(country, name)
        if name == "Bond Yield":
            raw = _get_indicator("US", "Interest Rate")
        score = _normalize(name, raw, currency)
        weight = WEIGHTS.get(name, 5)
        factors[name] = {"raw": raw, "score": score, "weight": weight}

    # Risk Sentiment
    sent_score = 70 if sentiment == "Risk On" else 30 if sentiment == "Risk Off" else 50
    factors["Risk Sentiment"] = {"raw": sentiment, "score": sent_score, "weight": WEIGHTS["Risk Sentiment"]}

    # Dollar Strength (inverse for non-USD)
    dxy_score = min(100, max(10, (dxy - 100) * 25 + 50))
    if currency != "USD":
        dxy_score = 100 - dxy_score
    factors["Dollar Strength"] = {"raw": dxy, "score": dxy_score, "weight": WEIGHTS["Dollar Strength"]}

    # Commodity Exposure
    comm_score = 50 + profile["commodity"] * 40
    factors["Commodity Exposure"] = {"raw": profile["commodity"], "score": comm_score, "weight": WEIGHTS["Commodity Exposure"]}

    # Safe Haven Demand
    haven_score = 50 + profile["safe_haven"] * 40
    factors["Safe Haven Demand"] = {"raw": profile["safe_haven"], "score": haven_score, "weight": WEIGHTS["Safe Haven Demand"]}

    # Growth (blend of GDP + Retail)
    gdp = factors.get("GDP", {}).get("score", 50)
    retail = factors.get("Retail Sales", {}).get("score", 50)
    growth_score = (gdp + retail) / 2
    factors["Growth"] = {"raw": None, "score": growth_score, "weight": WEIGHTS["Growth"]}

    # Momentum
    mom_score = min(100, max(10, 50 + momentum_val * 10))
    factors["Momentum"] = {"raw": momentum_val, "score": mom_score, "weight": WEIGHTS["Momentum"]}

    # Weighted aggregate
    total_weight = sum(f["weight"] for f in factors.values())
    weighted = sum(f["score"] * f["weight"] for f in factors.values()) / total_weight if total_weight else 50
    overall = round(weighted, 1)

    bullish = [name for name, f in factors.items() if f["score"] >= 55]
    bearish = [name for name, f in factors.items() if f["score"] <= 45]
    confidence = round(min(100, abs(overall - 50) * 2 + sum(min(f["weight"], 10) for f in factors.values() if abs(f["score"] - 50) > 15)), 0)

    return {
        "currency": currency,
        "overall_score": overall,
        "bullish_factors": bullish,
        "bearish_factors": bearish,
        "confidence": min(confidence, 95),
        "factors": factors,
    }


def compute_all_scores() -> list[dict[str, Any]]:
    """Compute scores for all currencies and persist to DB."""
    # Get current market context
    dxy_row = query_one("SELECT price FROM market_prices WHERE symbol = 'DXY'")
    dxy = dxy_row["price"] if dxy_row else 104.2

    # Determine risk sentiment from VIX
    vix_row = query_one("SELECT price FROM market_prices WHERE symbol = 'VIX'")
    vix = vix_row["price"] if vix_row else 14.5
    sentiment = "Risk On" if vix < 18 else "Risk Off" if vix > 25 else "Neutral"

    results: list[dict[str, Any]] = []
    for currency in CURRENCY_META:
        # Momentum from forex quote change
        forex = query_one("SELECT change_pct FROM forex_quotes WHERE symbol = ?", (f"{currency}USD",))
        momentum = forex["change_pct"] if forex else 0.0

        scored = _score_currency(currency, sentiment, dxy, momentum)
        meta = CURRENCY_META[currency]
        signal = _score_to_signal(scored["overall_score"])

        scored.update({
            "name": meta["name"],
            "flag": meta["flag"],
            "signal": signal,
            "trend": "up" if momentum > 0.05 else "down" if momentum < -0.05 else "flat",
            "momentum": round(momentum, 3),
            "sentiment": sentiment,
        })

        _persist_currency(scored)
        _persist_strength_history(currency, scored["overall_score"])
        results.append(scored)

    return results


def _score_to_signal(score: float) -> str:
    if score >= 70:
        return "Strong Buy"
    if score >= 58:
        return "Buy"
    if score >= 42:
        return "Neutral"
    if score >= 30:
        return "Sell"
    return "Strong Sell"


def _persist_currency(scored: dict[str, Any]) -> None:
    currency = scored["currency"]
    summary = _generate_summary(scored)
    execute(
        """
        INSERT INTO currencies (code, name, flag, score, ai_rating, confidence, trend, momentum, summary, last_update)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        ON CONFLICT(code) DO UPDATE SET
            score=excluded.score, ai_rating=excluded.ai_rating, confidence=excluded.confidence,
            trend=excluded.trend, momentum=excluded.momentum, summary=excluded.summary,
            last_update=datetime('now')
        """,
        (currency, scored["name"], scored["flag"], scored["overall_score"], scored["signal"], scored["confidence"], scored["trend"], scored["momentum"], summary),
    )


def _persist_strength_history(currency: str, score: float) -> None:
    execute(
        "INSERT INTO currency_strength_history (code, score, timestamp) VALUES (?, ?, datetime('now'))",
        (currency, score),
    )


def _generate_summary(scored: dict[str, Any]) -> str:
    signal = scored["signal"]
    score = scored["overall_score"]
    bull = scored["bullish_factors"]
    bear = scored["bearish_factors"]
    bull_str = ", ".join(bull[:4]) if bull else "limited bullish catalysts"
    bear_str = ", ".join(bear[:4]) if bear else "few bearish headwinds"
    return (
        f"{scored['currency']} scores {score}/100 ({signal}). "
        f"Bullish drivers: {bull_str}. Bearish headwinds: {bear_str}. "
        f"Confidence at {scored['confidence']}% with {scored['trend']} momentum."
    )
