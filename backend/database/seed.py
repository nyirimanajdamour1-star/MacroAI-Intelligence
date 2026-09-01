"""Database seed — populates baseline data on first boot.

Called after init_schema() during lifespan startup. Idempotent: uses
INSERT OR IGNORE / ON CONFLICT so re-running is safe. The scheduler will
overwrite these rows with live API data when keys are configured.
"""
from __future__ import annotations

import math
from datetime import datetime, timezone, timedelta

from backend.database.connection import execute, query_one


def seed_all() -> None:
    _seed_market_prices()
    _seed_forex_quotes()
    _seed_bond_yields()
    _seed_macro_indicators()
    _seed_central_banks()
    _seed_calendar()
    _seed_news()
    _seed_currencies()
    _seed_watchlist()
    _seed_futures()


# ---------------------------------------------------------------------------
# Market prices
# ---------------------------------------------------------------------------
_MARKETS = [
    ("DXY", "US Dollar Index", "forex", 104.2, 0.15),
    ("XAU", "Gold", "commodity", 2380.0, 8.0),
    ("XAG", "Silver", "commodity", 28.5, 0.4),
    ("WTI", "Crude Oil WTI", "commodity", 78.0, 1.2),
    ("BTC", "Bitcoin", "crypto", 67000.0, 800.0),
    ("ETH", "Ethereum", "crypto", 3500.0, 60.0),
    ("NDX", "NASDAQ 100", "index", 20200.0, 80.0),
    ("SPX", "S&P 500", "index", 5580.0, 18.0),
    ("VIX", "Volatility Index", "index", 14.5, 1.2),
    ("US10Y", "US 10Y Yield", "bond", 4.28, 0.04),
    ("US2Y", "US 2Y Yield", "bond", 4.72, 0.05),
]


def _seed_market_prices() -> None:
    for symbol, name, category, base, vol in _MARKETS:
        if query_one("SELECT symbol FROM market_prices WHERE symbol = ?", (symbol,)):
            continue
        t = datetime.now(timezone.utc).timestamp()
        wave = math.sin(t / 3600 + hash(symbol) % 100) * vol
        price = round(base + wave, 4)
        prev = round(base - wave * 0.5, 4)
        change = round(price - prev, 4)
        change_pct = round(((price - prev) / prev) * 100, 2) if prev else 0.0
        execute(
            "INSERT INTO market_prices (symbol, name, category, price, change, change_pct, timestamp) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))",
            (symbol, name, category, price, change, change_pct),
        )


# ---------------------------------------------------------------------------
# Forex quotes
# ---------------------------------------------------------------------------
_FOREX = {
    "EUR": (0.915, 0.003),
    "GBP": (0.775, 0.003),
    "JPY": (152.5, 0.8),
    "CHF": (0.885, 0.003),
    "CAD": (1.375, 0.005),
    "AUD": (1.505, 0.006),
    "NZD": (1.645, 0.007),
}


def _seed_forex_quotes() -> None:
    # USDUSD = 1.0
    if not query_one("SELECT symbol FROM forex_quotes WHERE symbol = 'USDUSD'"):
        execute(
            "INSERT INTO forex_quotes (symbol, base, quote, price, change, change_pct, timestamp) VALUES ('USDUSD', 'USD', 'USD', 1.0, 0.0, 0.0, datetime('now'))"
        )
    for code, (base, vol) in _FOREX.items():
        symbol = f"{code}USD"
        if query_one("SELECT symbol FROM forex_quotes WHERE symbol = ?", (symbol,)):
            continue
        t = datetime.now(timezone.utc).timestamp()
        wave = math.sin(t / 3600 + hash(code) % 100) * vol
        price = round(base + wave, 6)
        prev = round(base - wave * 0.5, 6)
        change = round(price - prev, 6)
        change_pct = round(((price - prev) / prev) * 100, 4) if prev else 0.0
        execute(
            "INSERT INTO forex_quotes (symbol, base, quote, price, change, change_pct, timestamp) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))",
            (symbol, code, "USD", price, change, change_pct),
        )


# ---------------------------------------------------------------------------
# Bond yields
# ---------------------------------------------------------------------------
def _seed_bond_yields() -> None:
    bonds = [("US", "10Y", 4.28), ("US", "2Y", 4.72)]
    for country, maturity, value in bonds:
        if query_one("SELECT id FROM bond_yields WHERE country = ? AND maturity = ?", (country, maturity)):
            continue
        execute(
            "INSERT INTO bond_yields (country, maturity, value, change, timestamp) VALUES (?, ?, ?, 0.0, datetime('now'))",
            (country, maturity, value),
        )


# ---------------------------------------------------------------------------
# Macro indicators
# ---------------------------------------------------------------------------
_MACRO = {
    "US": {"Interest Rate": (5.5, "%"), "Inflation": (3.0, "% YoY"), "GDP": (2.8, "% QoQ"), "Employment": (4.1, "%"), "Retail Sales": (0.6, "% MoM"), "Manufacturing": (48.7, "index"), "Trade Balance": (-68.0, "B USD")},
    "EU": {"Interest Rate": (3.75, "%"), "Inflation": (2.4, "% YoY"), "GDP": (0.4, "% QoQ"), "Employment": (6.3, "%"), "Retail Sales": (0.2, "% MoM"), "Manufacturing": (45.8, "index"), "Trade Balance": (18.0, "B EUR")},
    "GB": {"Interest Rate": (5.0, "%"), "Inflation": (2.0, "% YoY"), "GDP": (0.2, "% QoQ"), "Employment": (4.4, "%"), "Retail Sales": (0.3, "% MoM"), "Manufacturing": (47.5, "index"), "Trade Balance": (-5.0, "B GBP")},
    "JP": {"Interest Rate": (0.25, "%"), "Inflation": (2.8, "% YoY"), "GDP": (0.5, "% QoQ"), "Employment": (2.6, "%"), "Retail Sales": (1.0, "% MoM"), "Manufacturing": (49.0, "index"), "Trade Balance": (-2.0, "T JPY")},
    "CH": {"Interest Rate": (1.25, "%"), "Inflation": (1.2, "% YoY"), "GDP": (0.4, "% QoQ"), "Employment": (2.5, "%"), "Retail Sales": (0.1, "% MoM"), "Manufacturing": (49.3, "index"), "Trade Balance": (5.0, "B CHF")},
    "CA": {"Interest Rate": (4.5, "%"), "Inflation": (2.9, "% YoY"), "GDP": (0.3, "% QoQ"), "Employment": (6.4, "%"), "Retail Sales": (0.4, "% MoM"), "Manufacturing": (47.2, "index"), "Trade Balance": (-1.5, "B CAD")},
    "AU": {"Interest Rate": (4.35, "%"), "Inflation": (3.6, "% YoY"), "GDP": (0.3, "% QoQ"), "Employment": (4.1, "%"), "Retail Sales": (0.2, "% MoM"), "Manufacturing": (49.4, "index"), "Trade Balance": (5.0, "B AUD")},
    "NZ": {"Interest Rate": (5.25, "%"), "Inflation": (4.0, "% YoY"), "GDP": (0.2, "% QoQ"), "Employment": (4.8, "%"), "Retail Sales": (0.1, "% MoM"), "Manufacturing": (48.1, "index"), "Trade Balance": (-1.0, "B NZD")},
}


def _seed_macro_indicators() -> None:
    for country, indicators in _MACRO.items():
        for name, (value, unit) in indicators.items():
            if query_one("SELECT id FROM macro_indicators WHERE country = ? AND name = ?", (country, name)):
                continue
            execute(
                "INSERT INTO macro_indicators (country, code, name, value, unit, source, timestamp) VALUES (?, ?, ?, ?, ?, 'seed', datetime('now'))",
                (country, country, name, value, unit),
            )


# ---------------------------------------------------------------------------
# Central banks
# ---------------------------------------------------------------------------
_CENTRAL_BANKS = [
    {"code": "FED", "name": "Federal Reserve", "country": "US", "governor": "Jerome Powell", "rate": 5.5, "rate_name": "FED Funds Rate", "stance": "Hawkish Hold", "next_meeting": "2026-09-17", "last_change": "2023-07-26", "summary": "The Fed holds rates at a 23-year high, balancing sticky core inflation against a gradually cooling labor market. Powell has signaled that the next move is likely a cut, but not before confidence that inflation is sustainably toward 2%."},
    {"code": "ECB", "name": "European Central Bank", "country": "EU", "governor": "Christine Lagarde", "rate": 3.75, "rate_name": "Deposit Facility Rate", "stance": "Easing", "next_meeting": "2026-09-12", "last_change": "2024-06-12", "summary": "The ECB began its easing cycle in June 2024, cutting the deposit rate from 4.0%. Lagarde has signaled a data-dependent path, with markets pricing further cuts as eurozone inflation approaches target."},
    {"code": "BOE", "name": "Bank of England", "country": "GB", "governor": "Andrew Bailey", "rate": 5.0, "rate_name": "Bank Rate", "stance": "Hawkish Hold", "next_meeting": "2026-09-19", "last_change": "2023-08-03", "summary": "The BOE held at 5.0% after a first cut in August 2024. Bailey faces sticky services inflation and a tight labor market, keeping the MPC cautious about the pace of further easing."},
    {"code": "BOJ", "name": "Bank of Japan", "country": "JP", "governor": "Kazuo Ueda", "rate": 0.25, "rate_name": "Policy Rate", "stance": "Tightening", "next_meeting": "2026-09-20", "last_change": "2024-07-31", "summary": "The BOJ raised rates to 0.25% in July 2024, continuing its historic exit from negative rates. Ueda has signaled a gradual normalization path, with yen weakness and inflation above target supporting further tightening."},
    {"code": "BOC", "name": "Bank of Canada", "country": "CA", "governor": "Tiff Macklem", "rate": 4.5, "rate_name": "Overnight Rate", "stance": "Easing", "next_meeting": "2026-09-04", "last_change": "2024-07-24", "summary": "The BOC cut to 4.5% in July 2024, becoming the first G7 central bank to ease in this cycle. Macklem has signaled a measured easing path as Canadian inflation falls toward target."},
    {"code": "RBA", "name": "Reserve Bank of Australia", "country": "AU", "governor": "Michele Bullock", "rate": 4.35, "rate_name": "Cash Rate", "stance": "Hawkish Hold", "next_meeting": "2026-09-24", "last_change": "2023-11-07", "summary": "The RBA holds at 4.35%, with Bullock emphasizing that inflation remains too high and that a rate cut is not imminent. The RBA is the most hawkish among G10 central banks."},
    {"code": "RBNZ", "name": "Reserve Bank of New Zealand", "country": "NZ", "governor": "Adrian Orr", "rate": 5.25, "rate_name": "Official Cash Rate", "stance": "Hawkish Hold", "next_meeting": "2026-10-09", "last_change": "2023-05-24", "summary": "The RBNZ holds at 5.25% but has signaled that a cut is likely in 2026 as inflation cools. Orr has shifted from hawkish to a more balanced stance as growth slows."},
    {"code": "SNB", "name": "Swiss National Bank", "country": "CH", "governor": "Thomas Jordan", "rate": 1.25, "rate_name": "Policy Rate", "stance": "Easing", "next_meeting": "2026-09-26", "last_change": "2024-06-20", "summary": "The SNB cut to 1.25% in June 2024, its second cut of the year. Jordan has signaled further easing is likely as Swiss inflation remains well below target and the franc stays strong."},
]


def _seed_central_banks() -> None:
    for bank in _CENTRAL_BANKS:
        if query_one("SELECT code FROM central_banks WHERE code = ?", (bank["code"],)):
            continue
        execute(
            "INSERT INTO central_banks (code, name, country, governor, rate, rate_name, stance, next_meeting, last_change, summary, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))",
            (bank["code"], bank["name"], bank["country"], bank["governor"], bank["rate"], bank["rate_name"], bank["stance"], bank["next_meeting"], bank["last_change"], bank["summary"]),
        )


# ---------------------------------------------------------------------------
# Economic calendar
# ---------------------------------------------------------------------------
_EVENT_TEMPLATES = [
    ("CPI Release", "High"), ("GDP Release", "High"), ("Interest Rate Decision", "High"),
    ("Unemployment Rate", "Medium"), ("Manufacturing PMI", "Medium"),
    ("Retail Sales", "Medium"), ("Trade Balance", "Low"), ("Central Bank Speech", "Medium"),
]
_COUNTRIES = ["US", "EU", "GB", "JP", "CA", "AU", "NZ", "CH"]


def _seed_calendar() -> None:
    if query_one("SELECT id FROM economic_calendar LIMIT 1"):
        return
    now = datetime.now(timezone.utc)
    for i in range(30):
        country = _COUNTRIES[i % len(_COUNTRIES)]
        event_name, importance = _EVENT_TEMPLATES[i % len(_EVENT_TEMPLATES)]
        event_time = now + timedelta(hours=i * 6 - 48)
        forecast = round(2.5 + (i % 5) * 0.3, 2)
        previous = round(2.5 + ((i + 1) % 5) * 0.3, 2)
        actual = round(2.5 + ((i + 2) % 5) * 0.3, 2) if event_time < now else None
        execute(
            "INSERT INTO economic_calendar (timestamp, country, event, importance, actual, forecast, previous, source, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'seed', datetime('now'))",
            (event_time.isoformat(), country, event_name, importance, actual, forecast, previous),
        )


# ---------------------------------------------------------------------------
# News
# ---------------------------------------------------------------------------
_NEWS = [
    ("Fed signals patience as core inflation remains sticky above 2% target", "neutral", 0.1, "USD"),
    ("ECB's Lagarde warns markets against pricing too many rate cuts", "bearish", -0.4, "EUR"),
    ("BOJ's Ueda hints at further normalization as yen weakens past 152", "bullish", 0.5, "JPY"),
    ("US GDP grows 2.8% as consumer spending stays resilient", "bullish", 0.6, "USD"),
    ("UK inflation cools to 2.0%, BOE cut bets firm", "bullish", 0.3, "GBP"),
    ("Swiss inflation dips below 1.2%, SNB seen cutting again", "bearish", -0.3, "CHF"),
    ("Canadian dollar steadies as BOC signals measured easing path", "neutral", 0.0, "CAD"),
    ("Australian dollar firm as RBA holds hawkish stance", "bullish", 0.4, "AUD"),
    ("Gold hits record as geopolitical tensions and rate-cut bets rise", "bullish", 0.7, "XAU"),
    ("Oil drops on demand concerns despite OPEC+ supply cuts", "bearish", -0.5, "WTI"),
    ("Bitcoin reclaims $67k as ETF inflows accelerate", "bullish", 0.5, "BTC"),
    ("Manufacturing PMI contracts across G7, recession fears mount", "bearish", -0.6, "USD,EUR,GBP"),
    ("NZ dollar slips as RBNZ signals possible 2026 cut", "bearish", -0.3, "NZD"),
    ("US jobless claims fall, labor market remains tight", "bullish", 0.4, "USD"),
    ("Eurozone services PMI rebounds, easing recession fears", "bullish", 0.3, "EUR"),
]


def _seed_news() -> None:
    if query_one("SELECT id FROM news LIMIT 1"):
        return
    now = datetime.now(timezone.utc)
    for i, (headline, sentiment, score, currencies) in enumerate(_NEWS):
        t = now - timedelta(minutes=i * 15)
        execute(
            "INSERT INTO news (timestamp, source, headline, summary, url, sentiment, sentiment_score, currencies, updated_at) VALUES (?, 'MacroAI Wire', ?, ?, '', ?, ?, ?, datetime('now'))",
            (t.isoformat(), headline, f"Market analysis: {headline}. Traders are assessing the implications for monetary policy and currency markets.", sentiment, score, currencies),
        )


# ---------------------------------------------------------------------------
# Currencies (initial rows so the scoring engine has something to update)
# ---------------------------------------------------------------------------
_CURRENCY_META = {
    "USD": ("US Dollar", "🇺🇸"), "EUR": ("Euro", "🇪🇺"), "GBP": ("British Pound", "🇬🇧"),
    "JPY": ("Japanese Yen", "🇯🇵"), "CHF": ("Swiss Franc", "🇨🇭"), "CAD": ("Canadian Dollar", "🇨🇦"),
    "AUD": ("Australian Dollar", "🇦🇺"), "NZD": ("New Zealand Dollar", "🇳🇿"),
}


def _seed_currencies() -> None:
    for code, (name, flag) in _CURRENCY_META.items():
        if query_one("SELECT code FROM currencies WHERE code = ?", (code,)):
            continue
        execute(
            "INSERT INTO currencies (code, name, flag, score, ai_rating, confidence, trend, momentum, summary, last_update) VALUES (?, ?, ?, 50.0, 'Neutral', 50.0, 'flat', 0.0, 'Awaiting first score computation', datetime('now'))",
            (code, name, flag),
        )


# ---------------------------------------------------------------------------
# Default watchlist
# ---------------------------------------------------------------------------
_WATCHLIST = ["EURUSD", "GBPUSD", "USDJPY", "AUDUSD", "USDCAD", "USDCHF", "NZDUSD", "GBPJPY"]


def _seed_watchlist() -> None:
    for symbol in _WATCHLIST:
        if query_one("SELECT id FROM watchlist WHERE user_token = 'default' AND symbol = ?", (symbol,)):
            continue
        execute(
            "INSERT OR IGNORE INTO watchlist (user_token, symbol, kind) VALUES ('default', ?, 'pair')",
            (symbol,),
        )


# ---------------------------------------------------------------------------
# Futures instruments
# ---------------------------------------------------------------------------
import json

_FUTURES = [
    {"symbol": "SPX500", "name": "S&P 500 E-mini Futures", "category": "Index", "price": 5438.6, "change": 23.4, "change_pct": 0.43, "trend": "up", "ai_score": 72, "bias": "buy", "confidence": 78, "support": 5380, "resistance": 5520, "atr": 42.5, "volume": 1840000, "high": 5445, "low": 5402, "open": 5415, "prev_close": 5415.2, "provider_symbol": "ES=F", "instrument_type": "FUTURE"},
    {"symbol": "US100", "name": "Nasdaq-100 E-mini Futures", "category": "Index", "price": 19245.8, "change": 112.3, "change_pct": 0.59, "trend": "up", "ai_score": 76, "bias": "buy", "confidence": 82, "support": 19050, "resistance": 19500, "atr": 95.2, "volume": 1120000, "high": 19268, "low": 19148, "open": 19133, "prev_close": 19133.5, "provider_symbol": "NQ=F", "instrument_type": "FUTURE"},
    {"symbol": "US30", "name": "Dow Jones E-mini Futures", "category": "Index", "price": 39872.1, "change": -45.2, "change_pct": -0.11, "trend": "down", "ai_score": 48, "bias": "neutral", "confidence": 55, "support": 39700, "resistance": 40100, "atr": 128.4, "volume": 890000, "high": 39945, "low": 39810, "open": 39917, "prev_close": 39917.3, "provider_symbol": "YM=F", "instrument_type": "FUTURE"},
    {"symbol": "XAUUSD", "name": "Gold Spot", "category": "Metal", "price": 2418.5, "change": 8.7, "change_pct": 0.36, "trend": "up", "ai_score": 81, "bias": "buy", "confidence": 85, "support": 2390, "resistance": 2450, "atr": 18.3, "volume": 320000, "high": 2422, "low": 2405, "open": 2409.8, "prev_close": 2409.8, "provider_symbol": "XAU/USD", "instrument_type": "SPOT"},
    {"symbol": "XAGUSD", "name": "Silver Spot", "category": "Metal", "price": 31.42, "change": -0.28, "change_pct": -0.88, "trend": "down", "ai_score": 41, "bias": "sell", "confidence": 62, "support": 30.85, "resistance": 32.1, "atr": 0.52, "volume": 145000, "high": 31.78, "low": 31.3, "open": 31.7, "prev_close": 31.7, "provider_symbol": "XAG/USD", "instrument_type": "SPOT"},
    {"symbol": "WTI", "name": "WTI Crude Oil", "category": "Energy", "price": 78.35, "change": 1.22, "change_pct": 1.58, "trend": "up", "ai_score": 63, "bias": "buy", "confidence": 68, "support": 76.5, "resistance": 80.2, "atr": 1.85, "volume": 520000, "high": 78.88, "low": 77.12, "open": 77.13, "prev_close": 77.13, "provider_symbol": "WTI/USD", "instrument_type": "SPOT"},
    {"symbol": "BRENT", "name": "Brent Crude Oil", "category": "Energy", "price": 82.68, "change": 0.94, "change_pct": 1.15, "trend": "up", "ai_score": 59, "bias": "buy", "confidence": 60, "support": 80.8, "resistance": 84.5, "atr": 1.72, "volume": 410000, "high": 83.02, "low": 81.75, "open": 81.74, "prev_close": 81.74, "provider_symbol": "XBR/USD", "instrument_type": "SPOT"},
]


def _seed_futures() -> None:
    import math
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)
    for f in _FUTURES:
        if query_one("SELECT symbol FROM futures WHERE symbol = ?", (f["symbol"],)):
            continue
        history = []
        base = f["price"]
        trend = f["trend"]
        p = base * (0.96 if trend == "up" else 1.04)
        for i in range(29, -1, -1):
            from datetime import timedelta
            dt = now - timedelta(days=i)
            noise = (math.sin(i * 0.7) + math.cos(i * 1.3)) * (base * 0.005)
            p = p + (base * 0.0015 if trend == "up" else -base * 0.0015) + noise
            history.append({"date": dt.isoformat()[:10], "price": round(p, 2)})
        if history:
            history[-1]["price"] = base
        source = "seed"
        data_status = "OFFLINE"
        execute(
            "INSERT INTO futures (symbol, name, category, price, change, change_pct, trend, "
            "ai_score, bias, confidence, support, resistance, atr, volume, "
            "high, low, open, prev_close, history, timestamp, source, data_status, "
            "provider_symbol, instrument_type) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, ?, ?, ?)",
            (f["symbol"], f["name"], f["category"], f["price"], f["change"], f["change_pct"],
             f["trend"], f["ai_score"], f["bias"], f["confidence"], f["support"], f["resistance"],
             f["atr"], f["volume"], f["high"], f["low"], f["open"], f["prev_close"],
             json.dumps(history), source, data_status, f["provider_symbol"], f["instrument_type"]),
        )