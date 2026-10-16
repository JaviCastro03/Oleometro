"""Controller registry.

``api_router`` is the single entry point the application index mounts.
To add an endpoint family, create ``<name>_controller.py`` exposing a
``router`` and list the module in ``CONTROLLERS`` below.
"""

from fastapi import APIRouter

from . import dashboard_controller, health_controller, price_controller, production_controller

CONTROLLERS = (
    health_controller,
    dashboard_controller,
    price_controller,
    production_controller,
)

api_router = APIRouter(prefix="/api/v1")
for controller in CONTROLLERS:
    api_router.include_router(controller.router)

__all__ = ["api_router"]
