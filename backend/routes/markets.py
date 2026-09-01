"""Markets route — market prices (DXY, Gold, Oil, indices, bonds, crypto)."""
from __future__ import annotations

from fastapi import APIRouter

from backend.database.connection import query_all, query_one

router = APIRouter()


@router.get("/api/markets")
async def markets() -> dict:
    prices = query_all("SELECT symbol, name, category, price, change, change_pct, timestamp FROM market_prices ORDER BY category, symbol")
    bonds = query_all("SELECT country, maturity, value, change, timestamp FROM bond_yields ORDER BY maturity")
    forex = query_all("SELECT symbol, base, quote, price, change, change_pct, timestamp FROM forex_quotes ORDER BY symbol")
    return {"markets": prices, "bonds": bonds, "forex": forex}
