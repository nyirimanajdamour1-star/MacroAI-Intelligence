"""Pair engine.

Compares every currency against every other to generate all major FX pairs.
For each pair it computes the score difference, derives a signal (Strong Buy →
Strong Sell), confidence, risk level, and expected direction, then persists
a trade signal row.
"""
from __future__ import annotations

import logging
import math
import time
from typing import Any

from backend.database.connection import query_all, query_one, execute
from backend.ai.scoring_engine import compute_all_scores, _score_to_signal
from backend.config.settings import get_settings

logger = logging.getLogger("macroai.pairs")

CURRENCIES = ["USD", "EUR", "GBP", "JPY", "CHF", "CAD", "AUD", "NZD"]

# Major + cross pairs we explicitly generate.
PAIRS = [
    "USDJPY", "EURUSD", "GBPUSD", "AUDUSD", "NZDUSD", "USDCAD", "USDCHF",
    "EURJPY", "GBPJPY", "EURGBP", "EURCHF", "EURAUD", "EURNZD", "EURCAD",
    "GBPJPY", "GBPCHF", "GBPAUD", "GBPCAD", "GBPNZD",
    "AUDJPY", "AUDCHF", "AUDCAD", "AUDNZD",
    "NZDJPY", "NZDCHF", "NZDCAD",
    "CADJPY", "CADCHF",
    "CHFJPY",
]


def _split_pair(pair: str) -> tuple[str, str]:
    # 6-char pairs: 3+3
    if len(pair) == 6:
        return pair[:3], pair[3:]
    return pair[:3], pair[3:]


def _get_forex_price(pair: str) -> float | None:
    base, quote = _split_pair(pair)
    # Try direct
    row = query_one("SELECT price FROM forex_quotes WHERE symbol = ?", (pair,))
    if row:
        return row["price"]
    # Try inverse
    inv = f"{quote}{base}"
    row = query_one("SELECT price FROM forex_quotes WHERE symbol = ?", (inv,))
    if row and row["price"]:
        return round(1 / row["price"], 6)
    return None


def compute_all_pairs() -> list[dict[str, Any]]:
    """Generate signals for all pairs and persist."""
    scores = compute_all_scores()
    score_map = {s["currency"]: s for s in scores}
    demo_mode = not bool(get_settings().tradingeconomics_token)
    tick = time.time()

    results: list[dict[str, Any]] = []
    for idx, pair in enumerate(PAIRS):
        base, quote = _split_pair(pair)
        if base not in score_map or quote not in score_map:
            continue

        base_score = score_map[base]["overall_score"]
        quote_score = score_map[quote]["overall_score"]
        diff = round(base_score - quote_score, 1)

        if demo_mode:
            demo_wave = math.sin(tick / 18 + idx * 0.9) * 8
            diff = round(diff + demo_wave, 1)

        # Signal is from the perspective of buying the base currency.
        # Positive diff → buy the base. Slightly amplify the spread so signals
        # feel more trade-like and less neutral in the free/demo path.
        pair_score = round(50 + diff * 1.2, 1)
        pair_score = max(5, min(95, pair_score))
        signal = _score_to_signal(pair_score)

        confidence = round(min(95, abs(diff) * 2 + 30), 0)
        risk = "Low" if abs(diff) < 5 else "Medium" if abs(diff) < 12 else "High" if abs(diff) < 20 else "Very High"

        if diff > 5:
            expected_direction = f"Long {base}/{quote}"
        elif diff < -5:
            expected_direction = f"Short {base}/{quote}"
        else:
            expected_direction = "Neutral / Range-bound"

        price = _get_forex_price(pair)

        # Simple trade plan based on score
        entry = price
        if signal in ("Strong Buy", "Buy"):
            stop = round(price * 0.985, 6) if price else None
            tp1 = round(price * 1.015, 6) if price else None
            tp2 = round(price * 1.03, 6) if price else None
        elif signal in ("Strong Sell", "Sell"):
            stop = round(price * 1.015, 6) if price else None
            tp1 = round(price * 0.985, 6) if price else None
            tp2 = round(price * 0.97, 6) if price else None
        else:
            stop = round(price * 0.99, 6) if price else None
            tp1 = round(price * 1.01, 6) if price else None
            tp2 = round(price * 1.02, 6) if price else None

        rr = "2.0 : 1" if signal != "Neutral" else "1.0 : 1"
        holding = "4-8 weeks" if abs(diff) > 10 else "1-4 weeks" if abs(diff) > 5 else "days"

        result = {
            "pair": pair,
            "base": base,
            "quote": quote,
            "base_score": base_score,
            "quote_score": quote_score,
            "score_diff": diff,
            "pair_score": pair_score,
            "signal": signal,
            "confidence": confidence,
            "risk": risk,
            "expected_direction": expected_direction,
            "price": price,
            "entry": entry,
            "stop_loss": stop,
            "take_profit_1": tp1,
            "take_profit_2": tp2,
            "risk_reward": rr,
            "holding_period": holding,
            "base_bullish": score_map[base]["bullish_factors"],
            "base_bearish": score_map[base]["bearish_factors"],
            "quote_bullish": score_map[quote]["bullish_factors"],
            "quote_bearish": score_map[quote]["bearish_factors"],
        }
        results.append(result)
        _persist_signal(result)

    # Sort by absolute score difference (strongest signals first)
    results.sort(key=lambda r: abs(r["score_diff"]), reverse=True)
    return results


def _persist_signal(s: dict[str, Any]) -> None:
    execute(
        """
        INSERT INTO trade_signals (pair, timestamp, signal, confidence, risk, expected_direction, score_diff, entry, stop_loss, take_profit_1, take_profit_2, risk_reward, holding_period)
        VALUES (?, datetime('now'), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (s["pair"], s["signal"], s["confidence"], s["risk"], s["expected_direction"], s["score_diff"], s.get("entry"), s.get("stop_loss"), s.get("take_profit_1"), s.get("take_profit_2"), s["risk_reward"], s["holding_period"]),
    )
