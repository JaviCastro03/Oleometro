"""Application settings, read once from environment variables.

Every knob lives here so the rest of the code never touches ``os.environ``.
"""

from __future__ import annotations

import os
from dataclasses import dataclass


def _csv(value: str) -> tuple[str, ...]:
    return tuple(part.strip() for part in value.split(",") if part.strip())


@dataclass(frozen=True, slots=True)
class Settings:
    #: "sample" (offline demo data) or "agridata" (European Commission API).
    data_source: str = "sample"
    #: Member states shown in the dashboard (ISO 3166 alpha-2).
    countries: tuple[str, ...] = ("ES", "IT", "GR", "PT")
    agridata_base_url: str = "https://api.tech.ec.europa.eu/agrifood"
    #: First marketing year requested, e.g. 2014 -> "2014/2015".
    first_marketing_year: int = 2014
    cache_ttl_seconds: int = 6 * 3600
    request_timeout_seconds: float = 60.0
    cors_origins: tuple[str, ...] = ("http://localhost:5173", "http://127.0.0.1:5173")

    @classmethod
    def from_env(cls) -> "Settings":
        defaults = cls()
        return cls(
            data_source=os.getenv("OLIVE_DATA_SOURCE", defaults.data_source).lower(),
            countries=_csv(os.getenv("OLIVE_COUNTRIES", ",".join(defaults.countries))),
            agridata_base_url=os.getenv("OLIVE_AGRIDATA_URL", defaults.agridata_base_url).rstrip("/"),
            first_marketing_year=int(os.getenv("OLIVE_FIRST_MARKETING_YEAR", defaults.first_marketing_year)),
            cache_ttl_seconds=int(os.getenv("OLIVE_CACHE_TTL", defaults.cache_ttl_seconds)),
            request_timeout_seconds=float(os.getenv("OLIVE_TIMEOUT", defaults.request_timeout_seconds)),
            cors_origins=_csv(os.getenv("OLIVE_CORS_ORIGINS", ",".join(defaults.cors_origins))),
        )
