from datetime import date, timedelta

import pytest

from app.services.insights import compute_insights


def weekly(values, start=date(2023, 1, 1)):
    return [(start + timedelta(weeks=i), v) for i, v in enumerate(values)]


def test_week_change_and_peak():
    insight = compute_insights(weekly([100, 120, 200, 150]))
    assert insight.latest_price == 150
    assert insight.week_change_pct == -25.0
    assert insight.peak_price == 200
    assert insight.trough_price == 100
    assert insight.from_peak_pct == -25.0
    assert insight.level == 0.5


def test_year_change_uses_nearest_week_a_year_back():
    values = [100] + [100] * 51 + [150]  # 53 weekly points
    insight = compute_insights(weekly(values))
    assert insight.year_change_pct == 50.0


def test_year_change_is_none_when_history_is_short():
    assert compute_insights(weekly([100, 110])).year_change_pct is None


def test_flat_series_has_neutral_level_and_zero_volatility():
    insight = compute_insights(weekly([100, 100, 100]))
    assert insight.level == 0.5
    assert insight.volatility_52w == 0.0


def test_empty_series_is_rejected():
    with pytest.raises(ValueError):
        compute_insights([])
