# MacroAI Backend

FastAPI backend powering the MacroAI macroeconomic intelligence platform.

## Quick Start (CPython 3.11+)

```bash
# From the project root
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cd ..
python -m backend.main
```

The server starts at `http://localhost:8000`. The frontend dev server
(Vite, port 5173) proxies `/api/*` to the backend automatically.

## Architecture

```
backend/
  main.py              FastAPI app, lifespan, route registration
  config/settings.py   Environment-driven config (pydantic-settings)
  database/
    connection.py      SQLite connection pool (WAL mode, thread-safe)
    schema.py          Idempotent DDL — safe on every boot
    seed.py            Baseline data seeding on first boot
  models/schemas.py    Pydantic request/response models
  routes/              13 API routers (currencies, pairs, news, etc.)
  services/            External data fetchers with graceful fallback
  ai/
    scoring_engine.py  14-factor weighted currency scoring
    pair_engine.py     FX pair signal generation from currency scores
    analysis_service.py Institutional report generator
```

## Data Flow

1. **Boot**: Schema created → baseline data seeded → scores computed → scheduler started
2. **Scheduler**: Fetches live data from external APIs (FRED, TradingEconomics, NewsAPI,
   Alpha Vantage) on configurable intervals. When API keys are absent, realistic
   fallback data is generated so the platform is always functional.
3. **API**: Routes read from SQLite and return JSON. The scoring engine recomputes
   on every request to `/api/currencies` (configurable via `SCORE_ON_REQUEST`).

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/dashboard` | Aggregated dashboard data |
| GET | `/api/currencies` | All currency scores + history |
| GET | `/api/currencies/{code}` | Single currency detail |
| GET | `/api/pairs` | All FX pair signals |
| GET | `/api/markets` | Market prices, bonds, forex quotes |
| GET | `/api/macro?country=US` | Per-country macro indicators |
| GET | `/api/calendar` | Economic calendar events |
| GET | `/api/news` | Macroeconomic news feed |
| GET | `/api/central-banks` | Central bank data |
| GET | `/api/global-risk` | Risk sentiment gauge |
| GET | `/api/analysis` | AI reports for all currencies |
| GET | `/api/analysis/{code}` | AI report for one currency |
| GET | `/api/history?code=USD` | Currency strength history |
| GET | `/api/trades` | Trade signal history |
| GET | `/api/watchlist` | Default watchlist |
| POST | `/api/watchlist` | Add to watchlist |
| DELETE | `/api/watchlist` | Remove from watchlist |

## Environment Variables

All optional — the backend runs without any of these:

| Variable | Purpose |
|----------|---------|
| `FRED_API_KEY` | Federal Reserve Economic Data |
| `TRADINGECONOMICS_TOKEN` | TradingEconomics calendar + indicators |
| `NEWSAPI_KEY` | NewsAPI.org headlines |
| `ALPHA_VANTAGE_KEY` | Forex + market quotes |
| `SCORE_ON_REQUEST` | Recompute scores on every request (default: true) |
| `INTERVAL_FOREX` | Forex refresh seconds (default: 10) |
| `INTERVAL_MARKETS` | Market refresh seconds (default: 30) |
| `INTERVAL_MACRO` | Macro refresh seconds (default: 300) |
| `INTERVAL_CALENDAR` | Calendar refresh seconds (default: 60) |
| `INTERVAL_NEWS` | News refresh seconds (default: 300) |
| `INTERVAL_CENTRAL_BANKS` | Central bank refresh seconds (default: 3600) |

## Database

SQLite with WAL mode. The database file is at `backend/database/macroai.db`.
It is created automatically on first boot. The schema is idempotent and the
seed data uses `INSERT OR IGNORE` so re-seeding is safe.
