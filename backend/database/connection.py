"""SQLite connection helpers using the stdlib `sqlite3` driver.

We keep the DB layer intentionally thin: a single shared connection guarded by
a threading.Lock (SQLite serializes writes anyway). All writes are WAL-mode
for better concurrent read performance while the scheduler writes.
"""
from __future__ import annotations

import sqlite3
import threading
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator

from backend.config.settings import get_settings

_lock = threading.Lock()
_connection: sqlite3.Connection | None = None


def _init_connection() -> sqlite3.Connection:
    settings = get_settings()
    Path(settings.db_path).parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(settings.db_path, check_same_thread=False, timeout=30.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA foreign_keys=ON;")
    conn.execute("PRAGMA synchronous=NORMAL;")
    return conn


def get_connection() -> sqlite3.Connection:
    global _connection
    if _connection is None:
        _connection = _init_connection()
    return _connection


@contextmanager
def get_db() -> Iterator[sqlite3.Connection]:
    conn = get_connection()
    with _lock:
        yield conn
        conn.commit()


def execute(sql: str, params: tuple | None = None) -> sqlite3.Cursor:
    conn = get_connection()
    with _lock:
        cur = conn.execute(sql, params or ())
        conn.commit()
        return cur


def query_all(sql: str, params: tuple | None = None) -> list[dict]:
    conn = get_connection()
    with _lock:
        cur = conn.execute(sql, params or ())
        return [dict(r) for r in cur.fetchall()]


def query_one(sql: str, params: tuple | None = None) -> dict | None:
    conn = get_connection()
    with _lock:
        cur = conn.execute(sql, params or ())
        row = cur.fetchone()
        return dict(row) if row else None
