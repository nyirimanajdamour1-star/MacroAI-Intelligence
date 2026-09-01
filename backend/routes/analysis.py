"""Analysis route — AI-generated institutional reports."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from backend.ai.analysis_service import generate_analysis, generate_all_analyses
from backend.database.connection import query_all, query_one

router = APIRouter()


@router.get("/api/analysis")
async def analysis() -> list[dict]:
    return generate_all_analyses()


@router.get("/api/analysis/{code}")
async def analysis_by_code(code: str) -> dict:
    return generate_analysis(code)
