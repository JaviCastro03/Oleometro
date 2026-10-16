"""Export the dashboard payload as a static JSON file.

This is what makes zero-cost hosting possible: GitHub Actions runs this
script weekly and the React app reads the resulting file from GitHub Pages.

    python -m scripts.export_static --source agridata --out ../frontend/public/data/dashboard.json
"""

from __future__ import annotations

import argparse
import json
import sys
from dataclasses import replace
from pathlib import Path

from app.config import Settings
from app.core.errors import DataSourceError
from app.repositories import build_repository
from app.services.dashboard_service import DashboardService
from app.views.presenters import present_dashboard


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", choices=["sample", "agridata"], default=None)
    parser.add_argument("--out", type=Path, default=Path("../frontend/public/data/dashboard.json"))
    args = parser.parse_args(argv)

    settings = Settings.from_env()
    if args.source:
        settings = replace(settings, data_source=args.source)

    try:
        data = DashboardService(build_repository(settings)).dashboard()
    except DataSourceError as exc:
        # Fail loudly: never overwrite good published data with nothing.
        print(f"error: {exc}", file=sys.stderr)
        return 1

    payload = present_dashboard(data).model_dump(mode="json")
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(payload, separators=(",", ":")), encoding="utf-8")
    print(
        f"wrote {args.out} ({args.out.stat().st_size / 1024:.0f} KiB) "
        f"source={settings.data_source} series={len(payload['series'])}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
