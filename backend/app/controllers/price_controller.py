from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query

from ..dependencies import get_dashboard_service
from ..services.dashboard_service import DashboardService
from ..views.presenters import present_series
from ..views.schemas import SeriesView

router = APIRouter(prefix="/prices", tags=["prices"])


@router.get("", response_model=SeriesView, summary="Weekly national price series")
def get_prices(
    country: str = Query(..., min_length=2, max_length=2, examples=["ES"]),
    product: str = Query("evoo", examples=["evoo", "virgin", "lampante"]),
    start: date | None = Query(None, description="Only points on/after this date"),
    end: date | None = Query(None, description="Only points on/before this date"),
    service: DashboardService = Depends(get_dashboard_service),
) -> SeriesView:
    for series in service.dashboard().series:
        if series.country_code == country.upper() and series.product.value == product:
            view = present_series(series)
            view.points = [
                (d, p)
                for d, p in view.points
                if (start is None or d >= start.isoformat()) and (end is None or d <= end.isoformat())
            ]
            return view
    raise HTTPException(status_code=404, detail=f"No series for {country.upper()}/{product}")
