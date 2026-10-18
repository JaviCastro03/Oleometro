"""Turn domain objects into API schemas."""

from __future__ import annotations

from ..models.catalog import COUNTRY_LABELS, PRODUCT_LABELS, Product
from ..models.records import DashboardData, Forecast, Insight, ProductionRecord, Series
from .schemas import (
    BacktestView,
    DashboardView,
    ForecastHorizonView,
    ForecastView,
    InsightView,
    MetaView,
    OptionView,
    ProductionView,
    SeriesView,
)


def present_insight(insight: Insight) -> InsightView:
    data = {k: getattr(insight, k) for k in insight.__slots__}
    for key in ("latest_date", "peak_date", "trough_date"):
        data[key] = data[key].isoformat()
    return InsightView(**data)


def present_forecast(forecast: Forecast) -> ForecastView:
    horizons = []
    for h in forecast.horizons:
        backtest = None
        if h.backtest is not None:
            backtest = BacktestView(**{k: getattr(h.backtest, k) for k in h.backtest.__slots__})
        horizons.append(
            ForecastHorizonView(
                key=h.key,
                weeks=h.weeks,
                target_date=h.target_date.isoformat(),
                price=h.price,
                low=h.low,
                high=h.high,
                change_pct=h.change_pct,
                direction=h.direction,
                strength=h.strength,
                backtest=backtest,
            )
        )
    return ForecastView(
        horizons=horizons,
        path=[(day.isoformat(), price, low, high) for day, price, low, high in forecast.path],
    )


def present_series(series: Series) -> SeriesView:
    return SeriesView(
        country=series.country_code,
        product=series.product.value,
        points=[(day.isoformat(), price) for day, price in series.points],
        insight=present_insight(series.insight),
        forecast=present_forecast(series.forecast) if series.forecast else None,
    )


def present_production(record: ProductionRecord) -> ProductionView:
    return ProductionView(
        country=record.country_code,
        marketing_year=record.marketing_year,
        production_kt=record.production_kt,
        ending_stock_kt=record.ending_stock_kt,
        estimated=record.estimated,
    )


def present_dashboard(data: DashboardData) -> DashboardView:
    country_codes = sorted({s.country_code for s in data.series})
    product_order = [p for p in Product if any(s.product is p for s in data.series)]
    first = min(s.points[0][0] for s in data.series)
    last = max(s.points[-1][0] for s in data.series)
    return DashboardView(
        meta=MetaView(
            source=data.source,
            is_demo=data.is_demo,
            generated_at=data.generated_at,
            first_date=first.isoformat(),
            last_date=last.isoformat(),
        ),
        countries=[OptionView(id=c, label=COUNTRY_LABELS.get(c, c)) for c in country_codes],
        products=[OptionView(id=p.value, label=PRODUCT_LABELS[p]) for p in product_order],
        series=[present_series(s) for s in data.series],
        production=[present_production(r) for r in data.production],
    )
