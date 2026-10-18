"""Use case: build everything the dashboard needs from a repository."""

from __future__ import annotations

from collections import defaultdict
from datetime import date, datetime, timezone
from statistics import mean

from ..core.cache import TTLValue
from ..models.records import DashboardData, PriceObservation, Series
from ..repositories.base import OliveOilRepository
from .forecast import compute_forecast
from .insights import compute_insights


def aggregate_weekly(observations: list[PriceObservation]) -> list[Series]:
    """Average every market of a country into one national weekly price."""
    buckets: dict[tuple, dict[date, list[float]]] = defaultdict(lambda: defaultdict(list))
    for obs in observations:
        buckets[(obs.country_code, obs.product)][obs.week_start].append(obs.price_eur_per_tonne)

    series = []
    for (country, product), weeks in sorted(buckets.items(), key=lambda kv: (kv[0][0], kv[0][1].value)):
        points = tuple((week, round(mean(prices), 2)) for week, prices in sorted(weeks.items()))
        series.append(Series(country, product, points, compute_insights(points), compute_forecast(points)))
    return series


class DashboardService:
    def __init__(self, repository: OliveOilRepository, cache_ttl_seconds: float = 0) -> None:
        self._repository = repository
        self._cache = TTLValue(self._build, cache_ttl_seconds)

    def dashboard(self) -> DashboardData:
        return self._cache.get()

    def refresh(self) -> None:
        self._cache.clear()

    def _build(self) -> DashboardData:
        series = aggregate_weekly(self._repository.fetch_prices())
        production = self._repository.fetch_production()
        return DashboardData(
            source=self._repository.source_name,
            is_demo=self._repository.is_demo,
            generated_at=datetime.now(timezone.utc).isoformat(timespec="seconds"),
            series=tuple(series),
            production=tuple(sorted(production, key=lambda r: (r.country_code, r.marketing_year))),
        )
