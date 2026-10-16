"""Defensive parsers for the loosely typed strings the EU API returns.

The OpenAPI spec declares prices and dates as plain strings, so we accept the
formats seen in European open-data portals instead of assuming a single one.
"""

from __future__ import annotations

import re
from datetime import date, datetime

_DATE_FORMATS = ("%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y", "%d/%m/%y", "%d.%m.%Y")
_ISO_PREFIX = re.compile(r"^\d{4}-\d{2}-\d{2}")


def parse_decimal(raw: object) -> float:
    """Parse "4,250.50", "4.250,50", "425,5", "€ 425.00" or a number."""
    if isinstance(raw, bool):
        raise ValueError(f"not a number: {raw!r}")
    if isinstance(raw, (int, float)):
        return float(raw)

    text = re.sub(r"[^\d,.\-]", "", str(raw))
    if not re.search(r"\d", text):
        raise ValueError(f"not a number: {raw!r}")

    last_comma, last_dot = text.rfind(","), text.rfind(".")
    if last_comma != -1 and last_dot != -1:
        decimal_sep = "," if last_comma > last_dot else "."
    elif last_comma != -1:
        # "1,234" is thousands, "12,5" / "425,00" are decimals.
        decimal_sep = None if text.count(",") > 1 or len(text) - last_comma - 1 == 3 else ","
    elif last_dot != -1:
        decimal_sep = None if text.count(".") > 1 else "."
    else:
        decimal_sep = "."

    if decimal_sep == ",":
        text = text.replace(".", "").replace(",", ".")
    elif decimal_sep == ".":
        text = text.replace(",", "")
    else:
        text = text.replace(",", "").replace(".", "")
    return float(text)


def parse_date(raw: object) -> date:
    if isinstance(raw, datetime):
        return raw.date()
    if isinstance(raw, date):
        return raw
    text = str(raw).strip()
    if _ISO_PREFIX.match(text):
        return date.fromisoformat(text[:10])
    for fmt in _DATE_FORMATS:
        try:
            return datetime.strptime(text, fmt).date()
        except ValueError:
            continue
    raise ValueError(f"unrecognised date: {raw!r}")


def to_eur_per_tonne(value: float, unit: str | None) -> float:
    """Normalise a price to EUR/tonne. The EU portal quotes EUR/100 kg."""
    u = (unit or "").lower().replace(" ", "")
    if "100kg" in u:
        return value * 10
    if "1000kg" in u or "tonne" in u or u.endswith("/t"):
        return value
    if u.endswith("/kg") or u.endswith("perkg"):
        return value * 1000
    return value * 10  # documented default of the portal
