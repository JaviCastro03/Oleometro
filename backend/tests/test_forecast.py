"""Tests de la previsión: casos pequeños donde sabemos qué respuesta esperar."""

from datetime import date, timedelta
from math import exp, log, sin, pi

import pytest

from app.services.forecast import MIN_POINTS, compute_forecast, seasonal_factors


def weekly(values, start=date(2018, 1, 1)):
    """Convierte una lista de precios en puntos semanales (fecha, precio)."""
    return [(start + timedelta(weeks=i), v) for i, v in enumerate(values)]


def test_too_short_series_has_no_forecast():
    assert compute_forecast(weekly([3000.0] * (MIN_POINTS - 1))) is None


def test_constant_series_predicts_stability_and_does_not_crash():
    forecast = compute_forecast(weekly([3000.0] * 200))
    assert forecast is not None
    for horizon in forecast.horizons:
        assert horizon.direction == "flat"
        assert horizon.price == pytest.approx(3000.0, rel=1e-3)
        assert horizon.low <= horizon.price <= horizon.high


def test_rising_trend_is_forecast_as_rising():
    # +0,5 % cada semana durante 4 años: la tendencia es evidente.
    prices = [2000 * exp(0.005 * i) for i in range(208)]
    forecast = compute_forecast(weekly(prices))
    month = next(h for h in forecast.horizons if h.key == "month")
    assert month.direction == "up"
    assert month.price > prices[-1]


def test_falling_trend_is_forecast_as_falling():
    prices = [9000 * exp(-0.008 * i) for i in range(208)]
    forecast = compute_forecast(weekly(prices))
    month = next(h for h in forecast.horizons if h.key == "month")
    assert month.direction == "down"
    assert month.price < prices[-1]


def test_range_widens_with_the_horizon():
    # Una serie con ruido determinista (sin azar, para que el test sea estable).
    prices = [3000 + 300 * sin(i / 5) + 120 * sin(i * 1.7) for i in range(260)]
    forecast = compute_forecast(weekly(prices))
    widths = [(h.high - h.low) / h.price for h in forecast.horizons]
    assert widths == sorted(widths)
    assert len(forecast.path) == 52
    assert all(low <= price <= high for _, price, low, high in forecast.path)


def test_seasonality_is_learned():
    # La onda sin(2·pi·semana/52) empieza el 4 de enero: sube hasta abril y toca fondo en octubre.
    start = date(2016, 1, 4)
    prices = [3000 * exp(0.12 * sin(2 * pi * i / 52)) for i in range(312)]
    points = weekly(prices, start)
    factors = seasonal_factors([p[0] for p in points], [log(p[1]) for p in points])
    peak_month = max(factors, key=factors.get)
    trough_month = min(factors, key=factors.get)
    assert peak_month in (3, 4, 5) and trough_month in (9, 10, 11)
    assert sum(factors.values()) == pytest.approx(0, abs=1e-9)


def test_seasonality_needs_two_years():
    points = weekly([3000.0] * 80)
    assert set(seasonal_factors([p[0] for p in points], [log(p[1]) for p in points]).values()) == {0.0}


def test_backtest_is_reported_and_beats_naive_on_a_trend():
    prices = [2000 * exp(0.005 * i) for i in range(260)]
    month = next(h for h in compute_forecast(weekly(prices)).horizons if h.key == "month")
    assert month.backtest is not None
    assert month.backtest.samples >= 8
    assert month.backtest.vs_naive_pct > 0
