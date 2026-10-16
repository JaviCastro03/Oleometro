from fastapi import APIRouter, Depends, Query

from ..dependencies import get_dashboard_service
from ..services.dashboard_service import DashboardService
from ..views.presenters import present_production
from ..views.schemas import ProductionView

router = APIRouter(prefix="/production", tags=["production"])


@router.get("", response_model=list[ProductionView], summary="Annual production and stocks")
def get_production(
    country: str | None = Query(None, min_length=2, max_length=2),
    service: DashboardService = Depends(get_dashboard_service),
) -> list[ProductionView]:
    records = service.dashboard().production
    if country:
        records = tuple(r for r in records if r.country_code == country.upper())
    return [present_production(r) for r in records]
