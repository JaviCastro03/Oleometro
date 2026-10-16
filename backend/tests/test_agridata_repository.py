"""The repository is exercised against a mocked API that follows the OpenAPI spec."""

from datetime import date

import httpx
import pytest

from app.core.errors import DataSourceError
from app.repositories.agridata_repository import AgridataRepository

PRICE_ROWS = [
    {"memberStateCode": "ES", "memberStateName": "Spain", "beginDate": "01/01/2024",
     "endDate": "07/01/2024", "price": "896.60", "unit": "€/100 kg", "weekNumber": 1,
     "product": "Extra virgin olive oil (up to 0.8%)", "market": "Jaén", "marketingYear": "2023/2024"},
    {"memberStateCode": "ES", "memberStateName": "Spain", "beginDate": "01/01/2024",
     "endDate": "07/01/2024", "price": "900,00", "unit": "€/100 kg", "weekNumber": 1,
     "product": "Extra virgin olive oil (up to 0.8%)", "market": "Córdoba", "marketingYear": "2023/2024"},
    {"memberStateCode": "EL", "memberStateName": "Greece", "beginDate": "01/01/2024",
     "endDate": "07/01/2024", "price": "720.00", "unit": "€/100 kg", "weekNumber": 1,
     "product": "Lampante olive oil (2%)", "market": "Creta", "marketingYear": "2023/2024"},
    {"memberStateCode": "DE", "beginDate": "01/01/2024", "price": "1.00", "unit": "€/100 kg",
     "product": "Virgin olive oil (up to 2%)", "market": "x"},          # other country
    {"memberStateCode": "ES", "beginDate": "01/01/2024", "price": "1.00", "unit": "€/100 kg",
     "product": "Refined olive oil", "market": "x"},                   # other product
    {"memberStateCode": "ES", "beginDate": "garbage", "price": "1.00", "unit": "€/100 kg",
     "product": "Virgin olive oil (up to 2%)", "market": "x"},          # bad date
]

PRODUCTION_ROWS = [
    {"memberStateCode": "ES", "marketingYear": "2023/24", "productionYear": 2023,
     "yearProductionQuantity": 855000, "endingStockQuantity": 190000, "isEstimated": "N"},
    {"memberStateCode": "IT", "marketingYear": "2023/24", "productionYear": 2023,
     "yearProductionQuantity": 224000, "endingStockQuantity": 120000, "isEstimated": "Y"},
]


def make_repo(handler, today=date(2024, 6, 1)):
    client = httpx.Client(base_url="https://example.test", transport=httpx.MockTransport(handler))
    return AgridataRepository("https://example.test", ("ES", "IT", "GR", "PT"), 2023, client=client, today=today)


def test_prices_are_filtered_normalised_and_converted():
    seen = []

    def handler(request: httpx.Request) -> httpx.Response:
        seen.append(request.url.params.get("marketingYears"))
        return httpx.Response(200, json=PRICE_ROWS if request.url.params["marketingYears"] == "2023/2024" else [])

    observations = make_repo(handler).fetch_prices()

    assert seen == ["2023/2024", "2024/2025"]
    assert len(observations) == 3
    assert {o.country_code for o in observations} == {"ES", "GR"}  # EL -> GR
    jaen = next(o for o in observations if o.market == "Jaén")
    assert jaen.price_eur_per_tonne == 8966.0  # €/100 kg -> €/t
    assert jaen.week_start == date(2024, 1, 1)


def test_not_found_means_no_data_for_that_year():
    def handler(request):
        return httpx.Response(404, json={"error": "Not Found"})

    with pytest.raises(DataSourceError, match="no usable price rows"):
        make_repo(handler).fetch_prices()


def test_http_errors_become_data_source_errors():
    with pytest.raises(DataSourceError):
        make_repo(lambda request: httpx.Response(500)).fetch_prices()


def test_production_rescales_tonnes_to_thousand_tonnes():
    repo = make_repo(lambda request: httpx.Response(200, json=PRODUCTION_ROWS))
    records = {r.country_code: r for r in repo.fetch_production()}
    assert records["ES"].production_kt == 855.0
    assert records["ES"].ending_stock_kt == 190.0
    assert records["IT"].estimated is True
