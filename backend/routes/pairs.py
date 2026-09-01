"""Pairs route — all major and cross FX pair signals."""
from __future__ import annotations

from fastapi import APIRouter

from backend.ai.pair_engine import compute_all_pairs

router = APIRouter()


@router.get("/api/pairs")
async def pairs() -> list[dict]:
    return compute_all_pairs()
