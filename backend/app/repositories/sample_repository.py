"""Offline demo repository.

IMPORTANT: this data is SYNTHETIC. It is shaped after publicly reported
reference points for Spanish extra virgin olive oil (Poolred, MAPA, press
reports) and filled in with smooth interpolation plus seeded noise so the
dashboard works with zero network access. The UI flags it as demo data.
"""

from __future__ import annotations

import random
from datetime import date, timedelta

from ..models.catalog import Product
from ..models.records import PriceObservation, ProductionRecord

# (date, EUR/tonne) anchors for Spanish extra virgin olive oil.
_ES_EVOO_ANCHORS: tuple[tuple[str, float], ...] = (
    ("2017-12-31", 3700), ("2018-06-03", 3250), ("2018-10-28", 2650),
    ("2019-03-03", 2300), ("2019-12-29", 2150), ("2020-06-28", 2000),
    ("2020-12-27", 2400), ("2021-03-28", 3100), ("2021-09-26", 3500),
    ("2022-01-02", 3700), ("2022-05-01", 3900), ("2022-09-04", 3500),
    ("2022-12-25", 3800), ("2023-03-26", 5000), ("2023-06-25", 5500),
    ("2023-09-24", 6600), ("2023-12-24", 8660), ("2023-12-31", 8857),
    ("2024-01-07", 8966), ("2024-02-04", 9100), ("2024-04-07", 7565),
    ("2024-06-30", 8200), ("2024-09-29", 7700), ("2024-10-27", 6000),
    ("2024-11-10", 4700), ("2024-12-01", 4100), ("2025-01-05", 4270),
)

# country -> (price premium vs Spain, lag in weeks, noise scale)
_COUNTRY_PROFILE: dict[str, tuple[float, int, float]] = {
    "ES": (1.00, 0, 0.006),
    "IT": (1.14, 2, 0.010),
    "GR": (0.96, 3, 0.009),
    "PT": (1.02, 1, 0.008),
}

_PRODUCT_RATIO: dict[Product, float] = {
    Product.EVOO: 1.0,
    Product.VIRGIN: 0.965,
    Product.LAMPANTE: 0.925,
}

# country -> {marketing year: (production kt, ending stock kt, estimated)}
_PRODUCTION: dict[str, dict[str, tuple[float, float, bool]]] = {
    "ES": {"2017/18": (1255, 330, False), "2018/19": (1790, 590, False), "2019/20": (1125, 410, False),
           "2020/21": (1375, 380, False), "2021/22": (1490, 330, False), "2022/23": (665, 210, False),
           "2023/24": (855, 190, False), "2024/25": (1370, 260, True)},
    "IT": {"2017/18": (175, 120, False), "2018/19": (366, 130, False), "2019/20": (273, 140, False),
           "2020/21": (315, 150, False), "2021/22": (330, 160, False), "2022/23": (330, 150, False),
           "2023/24": (224, 120, False), "2024/25": (287, 130, True)},
    "GR": {"2017/18": (346, 60, False), "2018/19": (275, 70, False), "2019/20": (275, 60, False),
           "2020/21": (275, 55, False), "2021/22": (345, 60, False), "2022/23": (250, 50, False),
           "2023/24": (275, 45, False), "2024/25": (260, 50, True)},
    "PT": {"2017/18": (140, 30, False), "2018/19": (100, 28, False), "2019/20": (140, 30, False),
           "2020/21": (180, 35, False), "2021/22": (150, 32, False), "2022/23": (140, 30, False),
           "2023/24": (125, 27, False), "2024/25": (165, 30, True)},
}

_START = date(2018, 1, 7)
_END = date(2025, 1, 5)


def _interpolate(anchors: tuple[tuple[str, float], ...], day: date) -> float:
    points = [(date.fromisoformat(d), v) for d, v in anchors]
    if day <= points[0][0]:
        return points[0][1]
    if day >= points[-1][0]:
        return points[-1][1]
    for (d0, v0), (d1, v1) in zip(points, points[1:]):
        if d0 <= day <= d1:
            span = (d1 - d0).days or 1
            return v0 + (v1 - v0) * ((day - d0).days / span)
    return points[-1][1]


class SampleRepository:
    source_name = "sample"
    is_demo = True

    def __init__(self, countries: tuple[str, ...]) -> None:
        self._countries = tuple(c for c in countries if c in _COUNTRY_PROFILE)

    def fetch_prices(self) -> list[PriceObservation]:
        observations: list[PriceObservation] = []
        for country in self._countries:
            premium, lag, scale = _COUNTRY_PROFILE[country]
            for product, ratio in _PRODUCT_RATIO.items():
                rng = random.Random(f"{country}-{product.value}")
                drift = 0.0
                day = _START
                while day <= _END:
                    drift = 0.7 * drift + rng.gauss(0, scale)
                    base = _interpolate(_ES_EVOO_ANCHORS, day - timedelta(weeks=lag)) * premium
                    # Cheaper grades lose more value when the market is hot.
                    heat = min(max((base - 2000) / 7000, 0), 1)
                    price = base * (ratio - (1 - ratio) * heat) * (1 + drift)
                    observations.append(
                        PriceObservation(
                            country_code=country,
                            product=product,
                            market="Mercado nacional (demo)",
                            week_start=day,
                            price_eur_per_tonne=round(price, 2),
                        )
                    )
                    day += timedelta(weeks=1)
        return observations

    def fetch_production(self) -> list[ProductionRecord]:
        return [
            ProductionRecord(country, year, prod, stock, estimated)
            for country in self._countries
            for year, (prod, stock, estimated) in _PRODUCTION[country].items()
        ]
