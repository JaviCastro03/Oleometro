from __future__ import annotations

from typing import Protocol

from ..models.records import PriceObservation, ProductionRecord


class OliveOilRepository(Protocol):
    """Anything that can supply olive oil data. Add a new source by implementing this."""

    source_name: str
    is_demo: bool

    def fetch_prices(self) -> list[PriceObservation]: ...

    def fetch_production(self) -> list[ProductionRecord]: ...
