"""Pure analytics over a weekly price series. No I/O, trivially testable."""

from __future__ import annotations

from datetime import date, timedelta
from statistics import mean, pstdev
from typing import Sequence

from ..models.records import Insight

Point = tuple[date, float]


def pct_change(current: float, previous: float | None) -> float | None:
    if previous is None or previous == 0:
        return None
    return round((current / previous - 1) * 100, 2)


def _nearest(points: Sequence[Point], target: date, tolerance_days: int) -> float | None:
    best = min(points, key=lambda p: abs((p[0] - target).days))
    return best[1] if abs((best[0] - target).days) <= tolerance_days else None


def compute_insights(points: Sequence[Point]) -> Insight:
    if not points:
        raise ValueError("Cannot compute insights for an empty series")

    latest_date, latest = points[-1]
    previous = points[-2][1] if len(points) > 1 else None
    year_ago = _nearest(points, latest_date - timedelta(days=364), tolerance_days=10)

    peak = max(points, key=lambda p: p[1])
    trough = min(points, key=lambda p: p[1])

    window = [p for p in points if p[0] > latest_date - timedelta(days=364)]
    returns = [
        (b[1] / a[1] - 1) * 100 for a, b in zip(window, window[1:]) if a[1]
    ]
    spread = peak[1] - trough[1]

    return Insight(
        latest_date=latest_date,
        latest_price=round(latest, 2),
        week_change_pct=pct_change(latest, previous),
        year_change_pct=pct_change(latest, year_ago),
        peak_date=peak[0],
        peak_price=round(peak[1], 2),
        trough_date=trough[0],
        trough_price=round(trough[1], 2),
        from_peak_pct=round((latest / peak[1] - 1) * 100, 2),
        avg_52w=round(mean(p[1] for p in window), 2),
        volatility_52w=round(pstdev(returns), 2) if len(returns) > 1 else 0.0,
        level=round((latest - trough[1]) / spread, 4) if spread else 0.5,
    )
