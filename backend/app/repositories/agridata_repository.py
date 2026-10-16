"""Repository backed by the European Commission Agri-food Data Portal.

Docs: https://agridata.ec.europa.eu/extensions/API_Documentation/oliveoil.html
Spec: https://api.tech.ec.europa.eu/agrifood/v3/api-docs/olive_oil

We filter member states locally instead of through ``memberStateCodes``
because the spec does not say whether Greece is "GR" or "EL".
"""

from __future__ import annotations

import logging
from datetime import date

import httpx

from ..core.errors import DataSourceError
from ..core.parsing import parse_date, parse_decimal, to_eur_per_tonne
from ..models.catalog import normalize_country_code, normalize_product
from ..models.records import PriceObservation, ProductionRecord

log = logging.getLogger(__name__)


class AgridataRepository:
    source_name = "agridata"
    is_demo = False

    def __init__(
        self,
        base_url: str,
        countries: tuple[str, ...],
        first_marketing_year: int,
        timeout: float = 60.0,
        client: httpx.Client | None = None,
        today: date | None = None,
    ) -> None:
        self._countries = {normalize_country_code(c) for c in countries}
        self._first_year = first_marketing_year
        self._today = today or date.today()
        self._client = client or httpx.Client(base_url=base_url, timeout=timeout)

    # ------------------------------------------------------------------ prices
    def fetch_prices(self) -> list[PriceObservation]:
        observations: list[PriceObservation] = []
        skipped = 0
        for year in range(self._first_year, self._today.year + 1):
            rows = self._get("/api/oliveOil/prices", {"marketingYears": f"{year}/{year + 1}"})
            for row in rows:
                observation = self._to_observation(row)
                if observation is None:
                    skipped += 1
                else:
                    observations.append(observation)
        if skipped:
            log.info("Skipped %d price rows (other countries/products or unparseable)", skipped)
        if not observations:
            raise DataSourceError("The API returned no usable price rows")
        return observations

    def _to_observation(self, row: dict) -> PriceObservation | None:
        try:
            country = normalize_country_code(row["memberStateCode"])
            product = normalize_product(row["product"])
            if country not in self._countries or product is None:
                return None
            price = to_eur_per_tonne(parse_decimal(row["price"]), row.get("unit"))
            return PriceObservation(
                country_code=country,
                product=product,
                market=str(row.get("market", "")),
                week_start=parse_date(row["beginDate"]),
                price_eur_per_tonne=round(price, 2),
            )
        except (KeyError, ValueError, TypeError):
            return None

    # -------------------------------------------------------------- production
    def fetch_production(self) -> list[ProductionRecord]:
        rows = self._get("/api/oliveOil/production", {"granularity": "annual"})
        parsed: list[tuple[str, str, float, float | None, bool]] = []
        for row in rows:
            try:
                country = normalize_country_code(row["memberStateCode"])
                if country not in self._countries:
                    continue
                stock = row.get("endingStockQuantity")
                parsed.append(
                    (
                        country,
                        str(row["marketingYear"]),
                        parse_decimal(row["yearProductionQuantity"]),
                        None if stock is None else parse_decimal(stock),
                        str(row.get("isEstimated", "N")).upper() == "Y",
                    )
                )
            except (KeyError, ValueError, TypeError):
                continue

        # The portal's dashboard shows 1000 t. If the API returns plain tonnes
        # (no real country produces under 10 Mt) rescale to thousands of tonnes.
        divisor = 1000.0 if parsed and max(p[2] for p in parsed) >= 10_000 else 1.0
        return [
            ProductionRecord(
                country_code=c,
                marketing_year=my,
                production_kt=round(prod / divisor, 1),
                ending_stock_kt=None if stock is None else round(stock / divisor, 1),
                estimated=est,
            )
            for c, my, prod, stock, est in parsed
        ]

    # --------------------------------------------------------------- transport
    def _get(self, path: str, params: dict) -> list[dict]:
        try:
            response = self._client.get(path, params=params)
            if response.status_code == 404:
                return []  # the API answers 404 when a marketing year has no data
            response.raise_for_status()
            payload = response.json()
        except (httpx.HTTPError, ValueError) as exc:
            raise DataSourceError(f"Agri-food API request failed for {path}: {exc}") from exc
        return payload if isinstance(payload, list) else []
