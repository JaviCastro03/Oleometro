"""Dependency wiring (composition root). Override these in tests."""

from __future__ import annotations

from functools import lru_cache

from .config import Settings
from .repositories import build_repository
from .services.dashboard_service import DashboardService


@lru_cache
def get_settings() -> Settings:
    return Settings.from_env()


@lru_cache
def get_dashboard_service() -> DashboardService:
    settings = get_settings()
    return DashboardService(build_repository(settings), settings.cache_ttl_seconds)
