"""Central banks route."""
from __future__ import annotations

from fastapi import APIRouter

from backend.database.connection import query_all

router = APIRouter()


@router.get("/api/central-banks")
async def central_banks() -> list[dict]:
    return query_all("SELECT * FROM central_banks ORDER BY code")
