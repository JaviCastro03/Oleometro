import pytest
from fastapi.testclient import TestClient

from app.dependencies import get_dashboard_service
from app.main import create_app
from app.repositories.sample_repository import SampleRepository
from app.services.dashboard_service import DashboardService


@pytest.fixture(scope="module")
def client():
    app = create_app()
    service = DashboardService(SampleRepository(("ES", "IT", "GR", "PT")), cache_ttl_seconds=3600)
    app.dependency_overrides[get_dashboard_service] = lambda: service
    return TestClient(app)


def test_index_mounts_only_the_controller_router():
    from app.main import app

    api_paths = {path for path in app.openapi()["paths"] if path.startswith("/api")}
    assert api_paths == {
        "/api/v1/health",
        "/api/v1/dashboard",
        "/api/v1/prices",
        "/api/v1/production",
    }


def test_health(client):
    assert client.get("/api/v1/health").json()["status"] == "ok"


def test_dashboard_shape(client):
    body = client.get("/api/v1/dashboard").json()
    assert body["meta"]["is_demo"] is True
    assert [c["id"] for c in body["countries"]] == ["ES", "GR", "IT", "PT"]
    assert [p["id"] for p in body["products"]] == ["evoo", "virgin", "lampante"]
    assert len(body["series"]) == 12
    es = next(s for s in body["series"] if s["country"] == "ES" and s["product"] == "evoo")
    assert es["insight"]["peak_price"] > 9000
    assert "2023-12-01" <= es["insight"]["peak_date"] <= "2024-03-01"
    assert 0 <= es["insight"]["level"] <= 1
    assert len(es["points"]) > 300
    forecast = es["forecast"]
    assert [h["key"] for h in forecast["horizons"]] == ["week", "month", "year"]
    assert len(forecast["path"]) == 52
    assert all(h["low"] <= h["price"] <= h["high"] for h in forecast["horizons"])


def test_prices_filters_by_date(client):
    body = client.get("/api/v1/prices", params={"country": "es", "start": "2024-01-01"}).json()
    assert body["country"] == "ES"
    assert all(day >= "2024-01-01" for day, _ in body["points"])


def test_prices_unknown_series_is_404(client):
    assert client.get("/api/v1/prices", params={"country": "ZZ"}).status_code == 404


def test_production_filter(client):
    rows = client.get("/api/v1/production", params={"country": "ES"}).json()
    assert rows and {r["country"] for r in rows} == {"ES"}
