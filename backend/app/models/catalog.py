"""Domain vocabulary: products and countries."""

from __future__ import annotations

from enum import Enum


class Product(str, Enum):
    EVOO = "evoo"
    VIRGIN = "virgin"
    LAMPANTE = "lampante"


PRODUCT_LABELS: dict[Product, str] = {
    Product.EVOO: "Virgen extra",
    Product.VIRGIN: "Virgen",
    Product.LAMPANTE: "Lampante",
}

COUNTRY_LABELS: dict[str, str] = {
    "ES": "España",
    "IT": "Italia",
    "GR": "Grecia",
    "PT": "Portugal",
    "FR": "Francia",
    "HR": "Croacia",
    "CY": "Chipre",
    "SI": "Eslovenia",
}

_COUNTRY_ALIASES = {"EL": "GR"}  # the EU uses "EL" for Greece


def normalize_country_code(code: str) -> str:
    upper = code.strip().upper()
    return _COUNTRY_ALIASES.get(upper, upper)


def normalize_product(name: str) -> Product | None:
    """Map an EU product name ("Extra virgin olive oil (up to 0.8%)") to our enum."""
    lowered = name.lower()
    if "extra" in lowered:
        return Product.EVOO
    if "lampante" in lowered:
        return Product.LAMPANTE
    if "virgin" in lowered:
        return Product.VIRGIN
    return None
