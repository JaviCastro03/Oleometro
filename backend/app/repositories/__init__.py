"""Repository factory: the only place that knows which data sources exist."""

from __future__ import annotations

from ..config import Settings
from .agridata_repository import AgridataRepository
from .base import OliveOilRepository
from .sample_repository import SampleRepository


def build_repository(settings: Settings) -> OliveOilRepository:
    if settings.data_source == "agridata":
        return AgridataRepository(
            base_url=settings.agridata_base_url,
            countries=settings.countries,
            first_marketing_year=settings.first_marketing_year,
            timeout=settings.request_timeout_seconds,
        )
    if settings.data_source == "sample":
        return SampleRepository(settings.countries)
    raise ValueError(f"Unknown OLIVE_DATA_SOURCE: {settings.data_source!r}")


__all__ = ["OliveOilRepository", "build_repository"]
