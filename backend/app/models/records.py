"""Domain entities. Plain, immutable and free of any framework."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date

from .catalog import Product


@dataclass(frozen=True, slots=True)
class PriceObservation:
    country_code: str
    product: Product
    market: str
    week_start: date
    price_eur_per_tonne: float


@dataclass(frozen=True, slots=True)
class ProductionRecord:
    country_code: str
    marketing_year: str
    production_kt: float
    ending_stock_kt: float | None
    estimated: bool


@dataclass(frozen=True, slots=True)
class Insight:
    latest_date: date
    latest_price: float
    week_change_pct: float | None
    year_change_pct: float | None
    peak_date: date
    peak_price: float
    trough_date: date
    trough_price: float
    from_peak_pct: float
    avg_52w: float
    volatility_52w: float
    #: Position of the latest price inside its historical range, 0..1.
    level: float


@dataclass(frozen=True, slots=True)
class Series:
    country_code: str
    product: Product
    points: tuple[tuple[date, float], ...]
    insight: Insight


@dataclass(frozen=True, slots=True)
class DashboardData:
    source: str
    is_demo: bool
    generated_at: str
    series: tuple[Series, ...]
    production: tuple[ProductionRecord, ...]
