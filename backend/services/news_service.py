"""Macroeconomic news service.

Fetches news from NewsAPI when NEWSAPI_KEY is set. Otherwise generates
realistic fallback headlines with sentiment scoring.
"""
from __future__ import annotations

import logging
import random
from datetime import datetime, timezone, timedelta
from typing import Any

from backend.database.connection import execute
from backend.services.base_service import BaseDataService

logger = logging.getLogger("macroai.services.news")

FALLBACK_NEWS = [
    {"headline": "Fed signals patience as core inflation remains sticky above 2% target", "sentiment": "neutral", "score": 0.1, "currencies": "USD"},
    {"headline": "ECB's Lagarde warns markets against pricing too many rate cuts", "sentiment": "bearish", "score": -0.4, "currencies": "EUR"},
    {"headline": "BOJ's Ueda hints at further normalization as yen weakens past 152", "sentiment": "bullish", "score": 0.5, "currencies": "JPY"},
    {"headline": "US GDP grows 2.8% as consumer spending stays resilient", "sentiment": "bullish", "score": 0.6, "currencies": "USD"},
    {"headline": "UK inflation cools to 2.0%, BOE cut bets firm", "sentiment": "bullish", "score": 0.3, "currencies": "GBP"},
    {"headline": "Swiss inflation dips below 1.2%, SNB seen cutting again", "sentiment": "bearish", "score": -0.3, "currencies": "CHF"},
    {"headline": "Canadian dollar steadies as BOC signals measured easing path", "sentiment": "neutral", "score": 0.0, "currencies": "CAD"},
    {"headline": "Australian dollar firm as RBA holds hawkish stance", "sentiment": "bullish", "score": 0.4, "currencies": "AUD"},
    {"headline": "Gold hits record as geopolitical tensions and rate-cut bets rise", "sentiment": "bullish", "score": 0.7, "currencies": "XAU"},
    {"headline": "Oil drops on demand concerns despite OPEC+ supply cuts", "sentiment": "bearish", "score": -0.5, "currencies": "WTI"},
    {"headline": "Bitcoin reclaims $67k as ETF inflows accelerate", "sentiment": "bullish", "score": 0.5, "currencies": "BTC"},
    {"headline": "Manufacturing PMI contracts across G7, recession fears mount", "sentiment": "bearish", "score": -0.6, "currencies": "USD,EUR,GBP"},
    {"headline": "NZ dollar slips as RBNZ signals possible 2026 cut", "sentiment": "bearish", "score": -0.3, "currencies": "NZD"},
    {"headline": "US jobless claims fall, labor market remains tight", "sentiment": "bullish", "score": 0.4, "currencies": "USD"},
    {"headline": "Eurozone services PMI rebounds, easing recession fears", "sentiment": "bullish", "score": 0.3, "currencies": "EUR"},
]


class NewsService(BaseDataService):
    async def fetch_all(self) -> list[dict[str, Any]]:
        key = self.settings.newsapi_key
        articles: list[dict[str, Any]] = []

        if key:
            url = "https://newsapi.org/v2/everything"
            params = {
                "q": "macroeconomics OR inflation OR interest rate OR central bank OR forex",
                "language": "en",
                "sortBy": "publishedAt",
                "pageSize": 20,
                "apiKey": key,
            }
            data = await self._get_json(url, params=params)
            if data and "articles" in data:
                for art in data["articles"]:
                    articles.append({
                        "timestamp": art.get("publishedAt", datetime.now(timezone.utc).isoformat()),
                        "source": art.get("source", {}).get("name", "NewsAPI"),
                        "headline": art.get("title", ""),
                        "summary": art.get("description", ""),
                        "url": art.get("url", ""),
                        "sentiment": "neutral",
                        "sentiment_score": 0.0,
                        "currencies": "",
                    })

        if not articles:
            now = datetime.now(timezone.utc)
            rng = random.Random(int(now.timestamp() / 3600))
            for i, item in enumerate(FALLBACK_NEWS):
                t = now - timedelta(minutes=i * 15 + rng.randint(0, 10))
                articles.append({
                    "timestamp": t.isoformat(),
                    "source": "MacroAI Wire",
                    "headline": item["headline"],
                    "summary": f"Market analysis: {item['headline']}. Traders are assessing the implications for monetary policy and currency markets.",
                    "url": "",
                    "sentiment": item["sentiment"],
                    "sentiment_score": item["score"],
                    "currencies": item["currencies"],
                })

        for art in articles:
            self._insert(art)
        return articles

    @staticmethod
    def _insert(art: dict) -> None:
        execute(
            """
            INSERT INTO news (timestamp, source, headline, summary, url, sentiment, sentiment_score, currencies, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
            """,
            (art["timestamp"], art["source"], art["headline"], art.get("summary", ""), art.get("url", ""), art["sentiment"], art["sentiment_score"], art.get("currencies", "")),
        )
