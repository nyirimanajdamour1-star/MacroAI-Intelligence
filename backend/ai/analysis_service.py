"""AI analysis service.

Generates professional institutional macro reports for each currency by
combining macro scores, indicator values, central bank outlook, market
sentiment, news, and calendar data.

Each report contains:
  Executive Summary, Bullish Factors, Bearish Factors, Macro Environment,
  Central Bank Outlook, Risk Factors, Trade Recommendation, Expected
  Direction, Probability, Suggested Holding Time, Stop Loss Logic,
  Take Profit Logic, Confidence.

When no external LLM key is configured, reports are generated from a
rule-based template engine that produces institutional-grade prose from the
live data. This is designed to be swapped for an LLM call later.
"""
from __future__ import annotations

import json
import logging
from typing import Any

from backend.database.connection import query_all, query_one, query_all as q, execute
from backend.ai.scoring_engine import compute_all_scores, COUNTRY_MAP, CURRENCY_META
from backend.ai.pair_engine import compute_all_pairs

logger = logging.getLogger("macroai.ai")

CENTRAL_BANK_MAP = {"USD": "FED", "EUR": "ECB", "GBP": "BOE", "JPY": "BOJ", "CHF": "SNB", "CAD": "BOC", "AUD": "RBA", "NZD": "RBNZ"}


def generate_analysis(currency: str) -> dict[str, Any]:
    """Generate a full institutional report for one currency."""
    scores = compute_all_scores()
    score = next((s for s in scores if s["currency"] == currency), None)
    if not score:
        return {}

    country = COUNTRY_MAP.get(currency, "US")
    cb_code = CENTRAL_BANK_MAP.get(currency, "FED")

    # Gather context
    indicators = query_all("SELECT name, value, unit FROM macro_indicators WHERE country = ? ORDER BY timestamp DESC", (country,))
    cb = query_one("SELECT * FROM central_banks WHERE code = ?", (cb_code,))
    news = query_all("SELECT headline, sentiment, sentiment_score FROM news WHERE currencies LIKE ? ORDER BY timestamp DESC LIMIT 5", ("%" + currency + "%",))
    vix_row = query_one("SELECT price FROM market_prices WHERE symbol = 'VIX'")
    vix = vix_row["price"] if vix_row else 14.5
    dxy_row = query_one("SELECT price FROM market_prices WHERE symbol = 'DXY'")
    dxy = dxy_row["price"] if dxy_row else 104.2

    # Best pair for this currency
    pairs = compute_all_pairs()
    relevant = [p for p in pairs if currency in p["pair"]]
    best_pair = relevant[0] if relevant else None

    bull = score["bullish_factors"]
    bear = score["bearish_factors"]
    signal = score["signal"]
    conf = score["confidence"]
    s = score["overall_score"]

    # Build institutional prose
    exec_summary = _exec_summary(currency, signal, s, conf, bull, bear, cb)
    bullish_text = _bullish_factors(currency, bull, indicators, cb)
    bearish_text = _bearish_factors(currency, bear, indicators, cb)
    macro_env = _macro_environment(currency, indicators, dxy, vix)
    cb_outlook = _central_bank_outlook(cb, currency)
    risk_text = _risk_factors(currency, vix, bear, news)
    trade_rec = _trade_recommendation(signal, best_pair, currency)
    expected_dir = _expected_direction(signal, currency, best_pair)
    probability = _probability(signal, conf)
    holding = _holding_time(signal, s)
    stop_logic = _stop_logic(best_pair, signal)
    tp_logic = _take_profit_logic(best_pair, signal)

    report = {
        "currency": currency,
        "name": CURRENCY_META.get(currency, {}).get("name", currency),
        "flag": CURRENCY_META.get(currency, {}).get("flag", ""),
        "score": s,
        "signal": signal,
        "confidence": conf,
        "executive_summary": exec_summary,
        "bullish_factors": bullish_text,
        "bearish_factors": bearish_text,
        "macro_environment": macro_env,
        "central_bank_outlook": cb_outlook,
        "risk_factors": risk_text,
        "trade_recommendation": trade_rec,
        "expected_direction": expected_dir,
        "probability": probability,
        "holding_time": holding,
        "stop_loss": stop_logic,
        "take_profit": tp_logic,
        "best_pair": best_pair["pair"] if best_pair else None,
        "timestamp": _now(),
    }

    _persist_analysis(report)
    return report


def generate_all_analyses() -> list[dict[str, Any]]:
    reports = []
    for currency in CURRENCY_META:
        reports.append(generate_analysis(currency))
    return reports


def _now() -> str:
    from datetime import datetime, timezone
    return datetime.now(timezone.utc).isoformat()


def _exec_summary(c: str, signal: str, score: float, conf: float, bull: list, bear: list, cb: dict | None) -> str:
    cb_name = cb.get("name", "its central bank") if cb else "its central bank"
    stance = cb.get("stance", "Neutral") if cb else "Neutral"
    return (
        f"{c} currently scores {score}/100, warranting a {signal.upper()} recommendation with {conf}% confidence. "
        f"The assessment is driven by {len(bull)} bullish and {len(bear)} bearish factors across macro, technical, and sentiment dimensions. "
        f"{cb_name} maintains a {stance} stance, which anchors the medium-term outlook. "
        f"Key bullish drivers include {', '.join(bull[:3]) if bull else 'limited catalysts'}, while headwinds center on {', '.join(bear[:3]) if bear else 'few risks'}. "
        f"Traders should monitor central bank communications and incoming data for confirmation before committing risk."
    )


def _bullish_factors(c: str, bull: list, indicators: list, cb: dict | None) -> str:
    if not bull:
        return f"Currently, {c} faces limited bullish catalysts. The macro backdrop is balanced, and the currency is likely to trade range-bound unless new data shifts the outlook."
    parts = [f"The bullish case for {c} rests on {len(bull)} key pillars:"]
    for i, f in enumerate(bull[:5], 1):
        ind = next((x for x in indicators if x["name"] == f), None)
        if ind:
            parts.append(f"  {i}. {f} ({ind['value']}{ind['unit']}) — supports {c} attractiveness and capital inflows.")
        else:
            parts.append(f"  {i}. {f} — contributes positively to the composite score.")
    if cb and cb.get("stance") in ("Hawkish Hold", "Tightening"):
        parts.append(f"  {len(bull[:5])+1}. {cb['name']} maintains a {cb['stance']} policy, keeping the rate differential supportive.")
    return " ".join(parts)


def _bearish_factors(c: str, bear: list, indicators: list, cb: dict | None) -> str:
    if not bear:
        return f"Bearish risks for {c} are currently muted. The macro picture does not present significant headwinds, though traders should remain alert to shifts in global risk sentiment."
    parts = [f"The bearish case for {c} highlights {len(bear)} vulnerabilities:"]
    for i, f in enumerate(bear[:5], 1):
        ind = next((x for x in indicators if x["name"] == f), None)
        if ind:
            parts.append(f"  {i}. {f} ({ind['value']}{ind['unit']}) — weighs on {c} and could cap upside.")
        else:
            parts.append(f"  {i}. {f} — drags on the composite score.")
    return " ".join(parts)


def _macro_environment(c: str, indicators: list, dxy: float, vix: float) -> str:
    gdp = next((x for x in indicators if x["name"] == "GDP"), None)
    infl = next((x for x in indicators if x["name"] == "Inflation"), None)
    rate = next((x for x in indicators if x["name"] == "Interest Rate"), None)
    pmi = next((x for x in indicators if x["name"] == "Manufacturing"), None)

    gdp_str = f"GDP growth at {gdp['value']}{gdp['unit']}" if gdp else "GDP data pending"
    infl_str = f"inflation at {infl['value']}{infl['unit']}" if infl else "inflation data pending"
    rate_str = f"policy rate at {rate['value']}{rate['unit']}" if rate else "policy rate TBD"
    pmi_str = f"manufacturing PMI at {pmi['value']}" if pmi else "PMI pending"

    risk_mode = "Risk On" if vix < 18 else "Risk Off" if vix > 25 else "neutral risk"
    return (
        f"The macro environment for {c} is characterized by {gdp_str}, {infl_str}, and {rate_str}. "
        f"Manufacturing activity shows {pmi_str}. "
        f"The US Dollar Index trades at {dxy:.2f}, and the VIX at {vix:.1f} indicates a {risk_mode} regime. "
        f"This backdrop shapes the flow of capital and the relative attractiveness of {c} in the global carry trade."
    )


def _central_bank_outlook(cb: dict | None, c: str) -> str:
    if not cb:
        return f"Central bank data for {c} is not yet available."
    return (
        f"{cb['name']} ({cb['code']}), led by Governor {cb.get('governor', 'N/A')}, "
        f"holds the {cb.get('rate_name', 'policy rate')} at {cb.get('rate', 'N/A')}% with a {cb.get('stance', 'Neutral')} stance. "
        f"The next meeting is scheduled for {cb.get('next_meeting', 'TBD')}. "
        f"{cb.get('summary', '')}"
    )


def _risk_factors(c: str, vix: float, bear: list, news: list) -> str:
    risks = [f"Market volatility (VIX: {vix:.1f}) could spike on unexpected data or geopolitical events."]
    if bear:
        risks.append(f"Key macro headwinds ({', '.join(bear[:3])}) could intensify and reverse the current outlook.")
    risks.append("Central bank policy shifts could narrow or widen rate differentials abruptly.")
    risks.append("Liquidity conditions may deteriorate during risk-off episodes, amplifying volatility.")
    neg_news = [n for n in news if n.get("sentiment") == "bearish"]
    if neg_news:
        risks.append(f"Recent bearish headlines: {neg_news[0]['headline']}")
    return " ".join(risks)


def _trade_recommendation(signal: str, best_pair: dict | None, c: str) -> str:
    if not best_pair:
        return f"Signal: {signal}. No specific pair recommendation available at this time."
    return (
        f"Signal: {signal}. "
        f"Best expression: {best_pair['pair']} with {best_pair['confidence']}% confidence and {best_pair['risk']} risk. "
        f"Entry near {best_pair.get('entry', 'market')}, stop at {best_pair.get('stop_loss', 'TBD')}, "
        f"targets at {best_pair.get('take_profit_1', 'TBD')} and {best_pair.get('take_profit_2', 'TBD')}. "
        f"Risk/reward: {best_pair.get('risk_reward', 'TBD')}. Holding period: {best_pair.get('holding_period', 'TBD')}."
    )


def _expected_direction(signal: str, c: str, best_pair: dict | None) -> str:
    if best_pair:
        return best_pair["expected_direction"]
    if signal in ("Strong Buy", "Buy"):
        return f"Long {c} against weaker counterparts"
    if signal in ("Strong Sell", "Sell"):
        return f"Short {c} against stronger counterparts"
    return "Neutral / Range-bound"


def _probability(signal: str, conf: float) -> float:
    base = 50
    if signal in ("Strong Buy", "Strong Sell"):
        base = 72
    elif signal in ("Buy", "Sell"):
        base = 65
    return min(90, round(base + (conf - 50) * 0.3, 0))


def _holding_time(signal: str, score: float) -> str:
    if abs(score - 50) > 20:
        return "4-8 weeks (strong directional bias)"
    if abs(score - 50) > 10:
        return "1-4 weeks (moderate directional bias)"
    return "Intraday to 1 week (range-bound)"


def _stop_logic(best_pair: dict | None, signal: str) -> str:
    if not best_pair or not best_pair.get("stop_loss"):
        return "Stop placement should be beyond recent swing highs/lows, risking no more than 2% of portfolio."
    return f"Stop loss at {best_pair['stop_loss']}, placed beyond the recent swing {('low' if signal in ('Strong Buy','Buy') else 'high')}, risking ~2% of portfolio."


def _take_profit_logic(best_pair: dict | None, signal: str) -> str:
    if not best_pair or not best_pair.get("take_profit_1"):
        return "Take profit in two stages: 50% at 1R, 50% at 2R, trailing the stop after TP1."
    return (
        f"Take profit in two stages: TP1 at {best_pair['take_profit_1']} (50% of position), "
        f"TP2 at {best_pair['take_profit_2']} (remaining 50%). Trail stop after TP1 is hit."
    )


def _persist_analysis(report: dict[str, Any]) -> None:
    execute(
        """
        INSERT INTO ai_analysis (code, timestamp, executive_summary, bullish_factors, bearish_factors,
            macro_environment, central_bank_outlook, risk_factors, trade_recommendation,
            expected_direction, probability, holding_time, stop_loss, take_profit, confidence, score, signal)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            report["currency"], report["timestamp"], report["executive_summary"],
            report["bullish_factors"], report["bearish_factors"], report["macro_environment"],
            report["central_bank_outlook"], report["risk_factors"], report["trade_recommendation"],
            report["expected_direction"], report["probability"], report["holding_time"],
            report["stop_loss"], report["take_profit"], report["confidence"], report["score"], report["signal"],
        ),
    )
