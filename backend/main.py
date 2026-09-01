"""MacroAI FastAPI entrypoint.

Run with:  uvicorn backend.main:app --reload
"""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.config.settings import get_settings
from backend.database.schema import init_schema
from backend.database.seed import seed_all
from backend.ai.scoring_engine import compute_all_scores
from backend.ai.pair_engine import compute_all_pairs

from backend.routes import (
    dashboard,
    currencies,
    pairs,
    calendar,
    news,
    analysis,
    markets,
    watchlist,
    central_banks,
    global_risk,
    history,
    trades,
    macro,
    futures,
    scan,
)
from backend.models.schemas import HealthResponse

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")

# Suppress httpx request logging — it logs full URLs including API keys in query params
logging.getLogger("httpx").setLevel(logging.WARNING)

logger = logging.getLogger("macroai")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Boot: initializing schema")
    init_schema()
    logger.info("Boot: seeding baseline data")
    seed_all()
    logger.info("Boot: computing initial scores")
    try:
        compute_all_scores()
        compute_all_pairs()
        logger.info("Boot: scores computed")
    except Exception as exc:
        logger.warning("Boot: score computation deferred — %s", exc)
    logger.info("Boot: ready")

    try:
        from backend.services.scheduler import start_scheduler
        scheduler = start_scheduler()
        logger.info("Boot: scheduler started; registered jobs: %s", [job.id for job in scheduler.get_jobs()])
    except Exception as exc:
        logger.exception("Scheduler not started: %s", exc)

    yield
    logger.info("Shutdown")


settings = get_settings()
app = FastAPI(
    title="MacroAI Backend",
    version="1.0.0",
    description="Institutional macroeconomic intelligence platform API",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all route modules
app.include_router(dashboard.router)
app.include_router(currencies.router)
app.include_router(pairs.router)
app.include_router(calendar.router)
app.include_router(news.router)
app.include_router(analysis.router)
app.include_router(markets.router)
app.include_router(watchlist.router)
app.include_router(central_banks.router)
app.include_router(global_risk.router)
app.include_router(history.router)
app.include_router(trades.router)
app.include_router(macro.router)
app.include_router(futures.router)
app.include_router(scan.router)


@app.get("/api/health")
async def health() -> dict:
    """Health endpoint with per-provider market data status."""
    from backend.services.futures_service import get_provider_statuses

    provider_statuses = get_provider_statuses()

    # Overall market_data status: LIVE only if all providers are LIVE
    statuses = [ps["status"] for ps in provider_statuses.values()]
    if statuses and all(s == "LIVE" for s in statuses):
        market_data = "LIVE"
    elif any(s == "LIVE" for s in statuses):
        market_data = "STALE"  # partial — some providers live, some not
    elif any(s == "STALE" for s in statuses):
        market_data = "STALE"
    else:
        market_data = "OFFLINE"

    return {
        "status": "ok",
        "version": "1.0.0",
        "database": "connected",
        "market_data": market_data,
        "providers": provider_statuses,
    }
