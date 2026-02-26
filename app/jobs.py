import os
from datetime import datetime, timezone
from typing import List

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

# Import script modules (ensure scripts is a package)
from scripts import etl_aggregate
from scripts import heatmap as heatmap_mod
from sqlalchemy import MetaData


def _heatmap_levels() -> List[str]:
    levels = os.getenv("HEATMAP_LEVELS", "1")
    return [lvl.strip() for lvl in levels.split(",") if lvl.strip()]


def run_etl_job():
    """Run the ETL aggregation script (append-only)."""
    try:
        etl_aggregate.main()
        return {"status": "ok", "job": "etl"}
    except Exception as e:
        return {"status": "error", "job": "etl", "error": str(e)}


def run_heatmap_job(levels: List[str] | None = None, process_date: str | None = None):
    """Compute and store heatmaps for given levels on a date (YYYY-MM-DD)."""
    try:
        if levels is None:
            levels = _heatmap_levels()
        if process_date:
            target_date = datetime.fromisoformat(process_date).date()
        else:
            target_date = datetime.now(timezone.utc).date()

        engine = heatmap_mod.get_engine()
        meta = MetaData()
        try:
            meta.reflect(bind=engine, only=["heatmaps"])  # if exists
        except Exception:
            pass
        table = heatmap_mod.ensure_table(meta, engine)

        results = []
        for lvl in levels:
            df = heatmap_mod.fetch_events(engine, lvl, target_date)
            matrix = heatmap_mod.compute_heatmap(df)
            heatmap_mod.write_heatmap(engine, table, lvl, target_date, matrix)
            results.append({"level": lvl, "date": target_date.isoformat(), "sum": float(matrix.sum())})
        return {"status": "ok", "job": "heatmap", "results": results}
    except Exception as e:
        return {"status": "error", "job": "heatmap", "error": str(e)}


def create_scheduler() -> AsyncIOScheduler:
    scheduler = AsyncIOScheduler()

    # Intervals configurable via env (minutes)
    etl_minutes = int(os.getenv("ETL_INTERVAL_MINUTES", "15"))
    heatmap_minutes = int(os.getenv("HEATMAP_INTERVAL_MINUTES", "30"))

    scheduler.add_job(run_etl_job, IntervalTrigger(minutes=etl_minutes), id="etl-job", max_instances=1, coalesce=True)
    scheduler.add_job(
        run_heatmap_job,
        IntervalTrigger(
            minutes=heatmap_minutes),
        id="heatmap-job",
        max_instances=1,
        coalesce=True)
    return scheduler
