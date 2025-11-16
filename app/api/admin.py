import os
from typing import Optional, List

from fastapi import APIRouter, Header, HTTPException

from app.jobs import run_etl_job, run_heatmap_job

router = APIRouter(prefix="/admin", tags=["admin"])


def _require_api_key(x_api_key: Optional[str]):
    expected = os.getenv("ADMIN_API_KEY", "dev-admin-key")
    if not x_api_key or x_api_key != expected:
        raise HTTPException(status_code=401, detail="Unauthorized: invalid API key")


@router.post("/run-jobs")
def run_jobs(
    x_api_key: Optional[str] = Header(default=None, alias="x-api-key"),
    tasks: Optional[List[str]] = None,
    levels: Optional[List[str]] = None,
    date: Optional[str] = None,
):
    """Manually trigger ETL and/or heatmap jobs.

    - Provide header `x-api-key` matching ADMIN_API_KEY env var.
    - Body/query param `tasks`: ["etl", "heatmap"] (defaults to both)
    - Optional `levels`: list of levels for heatmap
    - Optional `date`: YYYY-MM-DD for heatmap (defaults to today UTC)
    """
    _require_api_key(x_api_key)

    tasks = tasks or ["etl", "heatmap"]
    results = []
    if "etl" in tasks:
        results.append(run_etl_job())
    if "heatmap" in tasks:
        results.append(run_heatmap_job(levels=levels, process_date=date))
    return {"status": "ok", "results": results}
