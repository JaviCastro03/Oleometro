"""API representations (the "V" of MVC on the backend).

Controllers never return domain objects directly; they return these schemas.
"""

from __future__ import annotations

from pydantic import BaseModel, Field


class OptionView(BaseModel):
    id: str
    label: str


class InsightView(BaseModel):
    latest_date: str
    latest_price: float
    week_change_pct: float | None
    year_change_pct: float | None
    peak_date: str
    peak_price: float
    trough_date: str
    trough_price: float
    from_peak_pct: float
    avg_52w: float
    volatility_52w: float
    level: float = Field(ge=0, le=1)


class BacktestView(BaseModel):
    samples: int
    mean_error_pct: float
    vs_naive_pct: float | None
    direction_hit_pct: float | None
    direction_samples: int


class ForecastHorizonView(BaseModel):
    key: str
    weeks: int
    target_date: str
    price: float
    low: float
    high: float
    change_pct: float
    direction: str
    strength: str
    backtest: BacktestView | None


class ForecastView(BaseModel):
    horizons: list[ForecastHorizonView]
    #: Compact [ISO date, price, low, high] rows, one per future week.
    path: list[tuple[str, float, float, float]]


class SeriesView(BaseModel):
    country: str
    product: str
    #: Compact [ISO date, EUR/tonne] pairs.
    points: list[tuple[str, float]]
    insight: InsightView
    forecast: ForecastView | None = None


class ProductionView(BaseModel):
    country: str
    marketing_year: str
    production_kt: float
    ending_stock_kt: float | None
    estimated: bool


class MetaView(BaseModel):
    source: str
    is_demo: bool
    generated_at: str
    unit: str = "EUR/t"
    first_date: str
    last_date: str


class DashboardView(BaseModel):
    meta: MetaView
    countries: list[OptionView]
    products: list[OptionView]
    series: list[SeriesView]
    production: list[ProductionView]
