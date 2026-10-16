from fastapi import APIRouter, Depends

from ..dependencies import get_dashboard_service
from ..services.dashboard_service import DashboardService
from ..views.presenters import present_dashboard
from ..views.schemas import DashboardView

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("", response_model=DashboardView, summary="Everything the dashboard renders")
def get_dashboard(service: DashboardService = Depends(get_dashboard_service)) -> DashboardView:
    return present_dashboard(service.dashboard())
