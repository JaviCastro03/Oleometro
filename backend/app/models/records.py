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
class BacktestStats:
    """Cuánto habría acertado el método en el pasado reciente, para un horizonte."""

    samples: int
    #: Error medio absoluto, en %.
    mean_error_pct: float
    #: Mejora frente a "el precio se queda igual" (positivo = mejor que lo ingenuo).
    vs_naive_pct: float | None
    #: % de veces que acertó si subía o bajaba (solo cuando preveía un cambio claro).
    direction_hit_pct: float | None
    direction_samples: int


@dataclass(frozen=True, slots=True)
class ForecastHorizon:
    """Previsión a un horizonte concreto (1 semana, 1 mes, 1 año)."""

    key: str
    weeks: int
    target_date: date
    price: float
    #: Rango del 80 %: el precio real debería caer entre low y high.
    low: float
    high: float
    change_pct: float
    #: "up" | "down" | "flat"
    direction: str
    #: "clear" (el rango entero está a un lado del precio actual) | "weak"
    strength: str
    backtest: BacktestStats | None


@dataclass(frozen=True, slots=True)
class Forecast:
    horizons: tuple[ForecastHorizon, ...]
    #: Línea completa semana a semana: (fecha, precio, mínimo, máximo).
    path: tuple[tuple[date, float, float, float], ...]


@dataclass(frozen=True, slots=True)
class Series:
    country_code: str
    product: Product
    points: tuple[tuple[date, float], ...]
    insight: Insight
    forecast: Forecast | None = None


@dataclass(frozen=True, slots=True)
class DashboardData:
    source: str
    is_demo: bool
    generated_at: str
    series: tuple[Series, ...]
    production: tuple[ProductionRecord, ...]
