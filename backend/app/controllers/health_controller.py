from fastapi import APIRouter, Depends

from ..config import Settings
from ..dependencies import get_settings

router = APIRouter(tags=["health"])


@router.get("/health")
def health(settings: Settings = Depends(get_settings)) -> dict:
    return {"status": "ok", "data_source": settings.data_source}
