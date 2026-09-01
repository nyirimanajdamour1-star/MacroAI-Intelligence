"""Schema bootstrap. Idempotent — safe to call on every startup.

Every table has a timestamp column so we can always show "last updated".
"""
from __future__ import annotations

from backend.database.connection import execute, query_all

SCHEMA = """
-- Core reference data ------------------------------------------------------
CREATE TABLE IF NOT EXISTS currencies (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    flag TEXT NOT NULL DEFAULT '',
    score REAL NOT NULL DEFAULT 0,
    ai_rating TEXT NOT NULL DEFAULT 'Neutral',
    confidence REAL NOT NULL DEFAULT 0,
    trend TEXT NOT NULL DEFAULT 'flat',
    momentum REAL NOT NULL DEFAULT 0,
    summary TEXT NOT NULL DEFAULT '',
    last_update TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS currency_strength_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL,
    timestamp TEXT NOT NULL DEFAULT (datetime('now')),
    score REAL NOT NULL,
    FOREIGN KEY (code) REFERENCES currencies(code)
);
CREATE INDEX IF NOT EXISTS idx_strength_code_ts ON currency_strength_history(code, timestamp);

-- Macro indicators ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS macro_indicators (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    country TEXT NOT NULL,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    value REAL,
    unit TEXT,
    previous REAL,
    frequency TEXT,
    source TEXT,
    timestamp TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(country, code, name)
);
CREATE INDEX IF NOT EXISTS idx_macro_country ON macro_indicators(country);

-- Economic calendar --------------------------------------------------------
CREATE TABLE IF NOT EXISTS economic_calendar (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,
    country TEXT NOT NULL,
    event TEXT NOT NULL,
    importance TEXT NOT NULL DEFAULT 'Medium',
    actual REAL,
    forecast REAL,
    previous REAL,
    source TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_calendar_ts ON economic_calendar(timestamp);

-- News ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS news (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL DEFAULT (datetime('now')),
    source TEXT,
    headline TEXT NOT NULL,
    summary TEXT,
    url TEXT,
    sentiment TEXT NOT NULL DEFAULT 'neutral',
    sentiment_score REAL NOT NULL DEFAULT 0,
    currencies TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_news_ts ON news(timestamp);

-- Central banks ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS central_banks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    country TEXT NOT NULL,
    governor TEXT,
    rate REAL,
    rate_name TEXT,
    stance TEXT NOT NULL DEFAULT 'Neutral',
    next_meeting TEXT,
    last_change TEXT,
    summary TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Bond yields --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bond_yields (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    country TEXT NOT NULL,
    maturity TEXT NOT NULL,
    value REAL NOT NULL,
    change REAL NOT NULL DEFAULT 0,
    timestamp TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(country, maturity)
);

-- Market prices ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS market_prices (
    symbol TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price REAL NOT NULL,
    change REAL NOT NULL DEFAULT 0,
    change_pct REAL NOT NULL DEFAULT 0,
    timestamp TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Forex quotes -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS forex_quotes (
    symbol TEXT PRIMARY KEY,
    base TEXT NOT NULL,
    quote TEXT NOT NULL,
    price REAL NOT NULL,
    change REAL NOT NULL DEFAULT 0,
    change_pct REAL NOT NULL DEFAULT 0,
    timestamp TEXT NOT NULL DEFAULT (datetime('now'))
);

-- AI analysis --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_analysis (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL,
    timestamp TEXT NOT NULL DEFAULT (datetime('now')),
    executive_summary TEXT,
    bullish_factors TEXT,
    bearish_factors TEXT,
    macro_environment TEXT,
    central_bank_outlook TEXT,
    risk_factors TEXT,
    trade_recommendation TEXT,
    expected_direction TEXT,
    probability REAL,
    holding_time TEXT,
    stop_loss TEXT,
    take_profit TEXT,
    confidence REAL,
    score REAL,
    signal TEXT
);

-- Trade signals ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS trade_signals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pair TEXT NOT NULL,
    timestamp TEXT NOT NULL DEFAULT (datetime('now')),
    signal TEXT NOT NULL,
    confidence REAL NOT NULL,
    risk TEXT,
    expected_direction TEXT,
    score_diff REAL,
    entry REAL,
    stop_loss REAL,
    take_profit_1 REAL,
    take_profit_2 REAL,
    risk_reward TEXT,
    holding_period TEXT
);

-- Watchlist ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS watchlist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_token TEXT NOT NULL DEFAULT 'default',
    symbol TEXT NOT NULL,
    kind TEXT NOT NULL DEFAULT 'pair',
    added_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_token, symbol, kind)
);

-- Futures instruments (SPX500, US100, US30, XAUUSD, XAGUSD, WTI, BRENT) ----
CREATE TABLE IF NOT EXISTS futures (
    symbol TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price REAL NOT NULL DEFAULT 0,
    change REAL NOT NULL DEFAULT 0,
    change_pct REAL NOT NULL DEFAULT 0,
    trend TEXT NOT NULL DEFAULT 'flat',
    ai_score REAL NOT NULL DEFAULT 50,
    bias TEXT NOT NULL DEFAULT 'neutral',
    confidence REAL NOT NULL DEFAULT 50,
    support REAL NOT NULL DEFAULT 0,
    resistance REAL NOT NULL DEFAULT 0,
    atr REAL NOT NULL DEFAULT 0,
    volume INTEGER NOT NULL DEFAULT 0,
    high REAL NOT NULL DEFAULT 0,
    low REAL NOT NULL DEFAULT 0,
    open REAL NOT NULL DEFAULT 0,
    prev_close REAL NOT NULL DEFAULT 0,
    history TEXT NOT NULL DEFAULT '[]',
    timestamp TEXT NOT NULL DEFAULT (datetime('now')),
    source TEXT NOT NULL DEFAULT 'seed',
    data_status TEXT NOT NULL DEFAULT 'OFFLINE',
    provider_symbol TEXT,
    instrument_type TEXT
);

-- Decision engine snapshots (Phase 5/7) ------------------------------------
CREATE TABLE IF NOT EXISTS decision_engine (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol TEXT NOT NULL,
    timestamp TEXT NOT NULL DEFAULT (datetime('now')),
    score REAL NOT NULL,
    signal TEXT NOT NULL,
    overall_confidence REAL,
    macro_confidence REAL,
    technical_confidence REAL,
    sentiment_confidence REAL,
    payload TEXT
);
"""


def init_schema() -> None:
    for statement in SCHEMA.split(";"):
        stmt = statement.strip()
        if stmt:
            execute(stmt)

    # Migrate existing futures table: add source + data_status columns if missing
    _migrate_futures_columns()


def _migrate_futures_columns() -> None:
    cols = query_all("PRAGMA table_info(futures)")
    if not cols:
        return
    col_names = {c["name"] for c in cols}
    if "source" not in col_names:
        execute("ALTER TABLE futures ADD COLUMN source TEXT NOT NULL DEFAULT 'seed'")
    if "data_status" not in col_names:
        execute("ALTER TABLE futures ADD COLUMN data_status TEXT NOT NULL DEFAULT 'OFFLINE'")
    if "provider_symbol" not in col_names:
        execute("ALTER TABLE futures ADD COLUMN provider_symbol TEXT")
    if "instrument_type" not in col_names:
        execute("ALTER TABLE futures ADD COLUMN instrument_type TEXT")
