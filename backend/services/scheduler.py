"""Background scheduler that refreshes each data feed on its own interval.

Uses APScheduler's AsyncIOScheduler. Each job is an async coroutine that
runs on the event loop. Failures are logged but never crash the app.

Intervals (seconds, configurable via settings):
  forex         10
  markets       30
  macro         300
  calendar      60
  news          300
  central banks 3600
  futures       60
"""
from __future__ import annotations

import logging
from datetime import datetime
from typing import Any

from apscheduler.schedulers.asyncio import AsyncIOScheduler

from backend.config.settings import get_settings
from backend.services.fred_service import FredService
from backend.services.forex_service import ForexService
from backend.services.market_service import MarketService
from backend.services.news_service import NewsService
from backend.services.tradingeconomics_service import TradingEconomicsService
from backend.services.futures_service import FuturesService

logger = logging.getLogger("macroai.scheduler")

_scheduler: AsyncIOScheduler | None = None
_services: dict[str, Any] = {}


def _get_service(name: str):
    if name not in _services:
        settings = get_settings()
        if name == "fred":
            _services[name] = FredService(settings)
        elif name == "te":
            _services[name] = TradingEconomicsService(settings)
        elif name == "market":
            _services[name] = MarketService(settings)
        elif name == "forex":
            _services[name] = ForexService(settings)
        elif name == "news":
            _services[name] = NewsService(settings)
        elif name == "futures":
            _services[name] = FuturesService(settings)
    return _services[name]


async def _run(job_name: str, coro_factory):
    try:
        await coro_factory()
        logger.info("scheduler: %s refreshed", job_name)
    except Exception as exc:  # pragma: no cover
        logger.warning("scheduler: %s failed: %s", job_name, exc)


def start_scheduler() -> AsyncIOScheduler:
    global _scheduler
    if _scheduler is not None:
        return _scheduler

    settings = get_settings()
    logger.info("scheduler: starting with interval_macro=%s", settings.interval_macro)
    _scheduler = AsyncIOScheduler()

    fred = lambda: _get_service("fred")
    te = lambda: _get_service("te")
    market = lambda: _get_service("market")
    forex = lambda: _get_service("forex")
    news = lambda: _get_service("news")
    futures = lambda: _get_service("futures")

    if settings.interval_forex:
        _scheduler.add_job(_run, "interval", seconds=settings.interval_forex, id="forex",
                           args=["forex", lambda: forex().fetch_all()])
    if settings.interval_markets:
        _scheduler.add_job(_run, "interval", seconds=settings.interval_markets, id="markets",
                           args=["markets", lambda: market().fetch_all()])
    if settings.interval_macro:
        _scheduler.add_job(_run, "interval", seconds=settings.interval_macro, id="fred",
                           args=["fred", lambda: fred().fetch_all()],
                           next_run_time=datetime.now())
        logger.info("scheduler: registered job fred")
        _scheduler.add_job(_run, "interval", seconds=settings.interval_macro, id="bonds",
                           args=["bonds", lambda: fred().fetch_bonds()],
                           next_run_time=datetime.now())
        logger.info("scheduler: registered job bonds")
        _scheduler.add_job(_run, "interval", seconds=settings.interval_macro, id="te_indicators",
                           args=["te_indicators", lambda: te().fetch_indicators()])
    if settings.interval_calendar:
        _scheduler.add_job(_run, "interval", seconds=settings.interval_calendar, id="calendar",
                           args=["calendar", lambda: te().fetch_calendar()])
    if settings.interval_news:
        _scheduler.add_job(_run, "interval", seconds=settings.interval_news, id="news",
                           args=["news", lambda: news().fetch_all()])
    if settings.interval_central_banks:
        _scheduler.add_job(_run, "interval", seconds=settings.interval_central_banks, id="central_banks",
                           args=["central_banks", lambda: te().fetch_central_banks()])
    if settings.interval_futures:
        _scheduler.add_job(_run, "interval", seconds=settings.interval_futures, id="futures",
                           args=["futures", lambda: futures().fetch_all()])

    _scheduler.start()
    logger.info("scheduler: registered jobs: %s", [job.id for job in _scheduler.get_jobs()])
    return _scheduler


def stop_scheduler() -> None:
    global _scheduler
    if _scheduler is not None:
        _scheduler.shutdown(wait=False)
        _scheduler = None
