#!/usr/bin/env python
"""Heatmap generation utility.

Reads event payloads containing x,y positions from the `events` table,
bins them with numpy.histogram2d into a 50x50 grid, and writes the
resulting matrix as JSON to a `heatmaps` table keyed by (level, date).

Usage (PowerShell):
  python scripts/heatmap.py --level level1 --date 2025-11-16

Optional arguments:
  --x-min, --x-max, --y-min, --y-max   (override auto range)
  --dry-run                            (compute only, do not write)

Assumptions:
 - Event table has columns: id, timestamp, payload (JSON)
 - payload JSON may include keys: x, y, level (level in payload can be
   used if --level not provided)
 - If no positions are found, a zero matrix is produced.

Provides helper function: get_heatmap(level, date) -> list[list[float]]
"""
import os
import json
import argparse
from datetime import datetime, date

import numpy as np
import pandas as pd
from sqlalchemy import create_engine, MetaData, Table, Column, String, Date, JSON, select, text
from sqlalchemy.dialects.postgresql import insert as pg_insert
from dotenv import load_dotenv

GRID_SIZE = 50


def get_engine():
    load_dotenv()
    dsn = os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg2://gameanalytics:password@localhost:5432/gameanalytics_db",
    ).replace("+asyncpg", "+psycopg2")
    return create_engine(dsn, future=True)


def ensure_table(meta: MetaData, engine):
    if "heatmaps" not in meta.tables:
        Table(
            "heatmaps",
            meta,
            Column("level", String, primary_key=True),
            Column("date", Date, primary_key=True),
            Column("grid_size", String, nullable=False),
            Column("matrix", JSON, nullable=False),
        )
        meta.create_all(engine, tables=[meta.tables["heatmaps"]])
    return meta.tables["heatmaps"]


def fetch_events(engine, level: str | None, target_date: date) -> pd.DataFrame:
    with engine.connect() as conn:
        # Use SQLAlchemy text() for named parameter binding
        sql = text(
            """
            SELECT id, timestamp, payload
            FROM events
            WHERE DATE(timestamp) = :target_date
            ORDER BY timestamp ASC
            """
        )
        try:
            df = pd.read_sql_query(sql, conn, params={"target_date": target_date})
        except Exception as e:
            print(f"Failed to fetch events: {e}")
            return pd.DataFrame(columns=["id", "timestamp", "payload"])
    if df.empty:
        return df
    # Normalize payload for easy access
    try:
        payload_df = pd.json_normalize(df["payload"])
    except Exception:
        payload_df = pd.DataFrame(index=df.index)
    payload_df = payload_df.add_prefix("payload_")
    df = df.drop(columns=["payload"]).join(payload_df)
    if level:
        if "payload_level" in df.columns:
            df = df[df["payload_level"].astype(str) == level]
    return df


def compute_heatmap(df: pd.DataFrame, x_min=None, x_max=None, y_min=None, y_max=None) -> np.ndarray:
    if df.empty:
        return np.zeros((GRID_SIZE, GRID_SIZE), dtype=float)
    # Extract x,y
    x = pd.to_numeric(df.get("payload_x"), errors="coerce")
    y = pd.to_numeric(df.get("payload_y"), errors="coerce")
    # Drop NaNs
    valid = (~x.isna()) & (~y.isna())
    x = x[valid]
    y = y[valid]
    if x.empty:
        return np.zeros((GRID_SIZE, GRID_SIZE), dtype=float)
    # Determine range
    xr = (x_min if x_min is not None else float(x.min()), x_max if x_max is not None else float(x.max()))
    yr = (y_min if y_min is not None else float(y.min()), y_max if y_max is not None else float(y.max()))
    # Avoid zero-width ranges
    if xr[0] == xr[1]:
        xr = (xr[0] - 0.5, xr[1] + 0.5)
    if yr[0] == yr[1]:
        yr = (yr[0] - 0.5, yr[1] + 0.5)
    hist, xedges, yedges = np.histogram2d(x, y, bins=GRID_SIZE, range=[xr, yr])
    # Normalize counts (optional); here keep raw counts
    return hist.T  # transpose so rows=Y bins, cols=X bins


def write_heatmap(engine, table, level: str, target_date: date, matrix: np.ndarray):
    matrix_list = matrix.tolist()
    stmt = pg_insert(table).values(
        level=level,
        date=target_date,
        grid_size=str(GRID_SIZE),
        matrix=matrix_list,
    ).on_conflict_do_update(
        index_elements=[table.c.level, table.c.date],
        set_={"matrix": matrix_list, "grid_size": str(GRID_SIZE)},
    )
    with engine.begin() as conn:
        conn.execute(stmt)
    print(f"Stored heatmap for level='{level}' date={target_date} (shape {matrix.shape}).")


def get_heatmap(level: str, target_date: date):
    engine = get_engine()
    meta = MetaData()
    meta.reflect(bind=engine, only=["heatmaps"])
    if "heatmaps" not in meta.tables:
        return None
    table = meta.tables["heatmaps"]
    with engine.connect() as conn:
        row = conn.execute(
            select(table.c.matrix).where(table.c.level == level, table.c.date == target_date)
        ).fetchone()
    if not row:
        return None
    return row[0]


def parse_args():
    ap = argparse.ArgumentParser(description="Generate position heatmap for a level/date.")
    ap.add_argument("--level", required=False, help="Level identifier (if omitted, uses payload_level)")
    ap.add_argument("--date", required=True, help="Date (YYYY-MM-DD) to process")
    ap.add_argument("--x-min", type=float, help="Override X min")
    ap.add_argument("--x-max", type=float, help="Override X max")
    ap.add_argument("--y-min", type=float, help="Override Y min")
    ap.add_argument("--y-max", type=float, help="Override Y max")
    ap.add_argument("--dry-run", action="store_true", help="Compute only; do not write heatmap")
    return ap.parse_args()


def main():
    args = parse_args()
    try:
        target_date = datetime.strptime(args.date, "%Y-%m-%d").date()
    except ValueError:
        raise SystemExit("Invalid --date format; expected YYYY-MM-DD")

    engine = get_engine()
    meta = MetaData()
    # Try reflecting existing table; if not present, create it.
    try:
        meta.reflect(bind=engine, only=["heatmaps"])  # reflect if exists
    except Exception:
        # Ignore reflection errors; we'll create the table below.
        pass
    table = ensure_table(meta, engine)

    df = fetch_events(engine, args.level, target_date)
    print(f"Fetched {len(df)} events for date {target_date} (level filter: {args.level or 'payload_level'})")
    matrix = compute_heatmap(
        df,
        x_min=args.x_min,
        x_max=args.x_max,
        y_min=args.y_min,
        y_max=args.y_max,
    )
    print(f"Heatmap matrix shape: {matrix.shape}; total counts: {matrix.sum():.0f}")

    # Determine level key: CLI --level preferred else first payload_level or 'default'
    if args.level:
        level_key = args.level
    else:
        level_key = (
            df.get("payload_level").dropna().astype(str).iloc[0]
            if (not df.empty and "payload_level" in df.columns and df["payload_level"].notna().any())
            else "default"
        )

    if args.dry_run:
        print("Dry run: not persisting heatmap.")
        return
    write_heatmap(engine, table, level_key, target_date, matrix)


if __name__ == "__main__":
    main()
