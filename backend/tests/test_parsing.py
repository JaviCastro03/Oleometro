import pytest

from app.core.parsing import parse_date, parse_decimal, to_eur_per_tonne


@pytest.mark.parametrize(
    "raw, expected",
    [
        ("425.50", 425.5),
        ("425,50", 425.5),
        ("4,250.50", 4250.5),
        ("4.250,50", 4250.5),
        ("€ 425.00", 425.0),
        ("1,234", 1234.0),
        ("1.234.567", 1234567.0),
        (425, 425.0),
    ],
)
def test_parse_decimal(raw, expected):
    assert parse_decimal(raw) == expected


@pytest.mark.parametrize("raw", ["", "n/a", None, True])
def test_parse_decimal_rejects_garbage(raw):
    with pytest.raises(ValueError):
        parse_decimal(raw)


@pytest.mark.parametrize(
    "raw",
    ["07/01/2024", "2024-01-07", "2024-01-07T00:00:00", "07-01-2024", "07.01.2024"],
)
def test_parse_date_formats(raw):
    assert parse_date(raw).isoformat() == "2024-01-07"


def test_parse_date_rejects_garbage():
    with pytest.raises(ValueError):
        parse_date("last week")


@pytest.mark.parametrize(
    "unit, factor",
    [("€/100 kg", 10), ("EUR/100kg", 10), ("€/t", 1), ("EUR/tonne", 1), ("€/kg", 1000), (None, 10)],
)
def test_unit_conversion(unit, factor):
    assert to_eur_per_tonne(1.0, unit) == factor
