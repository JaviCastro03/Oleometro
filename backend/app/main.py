"""Application index.

By design this file wires exactly one route: the controller layer.
Everything else (endpoints, validation, serialisation) lives behind it.
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .controllers import api_router
from .core.errors import DataSourceError
from .dependencies import get_settings


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="Olive Oil Prices API",
        version="1.0.0",
        description="Weekly olive oil prices and production across EU producers.",
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(settings.cors_origins),
        allow_methods=["GET"],
        allow_headers=["*"],
    )

    @app.exception_handler(DataSourceError)
    async def data_source_error(_: Request, exc: DataSourceError) -> JSONResponse:
        return JSONResponse(status_code=502, content={"detail": str(exc)})

    app.include_router(api_router)  # <- the one and only route to the controllers
    return app


app = create_app()
