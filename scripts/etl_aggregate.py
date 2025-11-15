#!/usr/bin/env python
"""
Minimal ETL scaffold:
- Connects to Postgres using SQLAlchemy
- Loads rows from the `events` table into a Pandas DataFrame
- Prints the DataFrame shape

Note: Ensure `pandas` is installed and a Postgres instance is reachable.
Uses `DATABASE_URL` from environment if set (prefers psycopg2 driver).
"""
import os

from sqlalchemy import create_engine
from dotenv import load_dotenv
import pandas as pd
import numpy as np


def get_engine():
    """Create a synchronous SQLAlchemy engine for Postgres.

    Prefers psycopg2 driver so Pandas can use the connection directly.
    """
    load_dotenv()
    dsn = os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg2://gameanalytics:password@localhost:5432/gameanalytics_db",
    )
    # If async URL is provided, switch to psycopg2 for Pandas compatibility
    dsn = dsn.replace("+asyncpg", "+psycopg2")
    return create_engine(dsn, future=True)


def save_session_summary(df: pd.DataFrame, engine):
    """Append session-level aggregates into leaderboard_aggregates using pandas.to_sql.

    - Uses synchronous SQLAlchemy engine and pandas.to_sql.
    - Expects df to have columns: session_id, event_count, max_score.
    - Does not drop or truncate; simply appends rows.
    """
    if df is None or df.empty:
        print("No session aggregates to write.")
        return

    expected_cols = {"session_id", "event_count", "max_score"}
    missing = expected_cols - set(df.columns)
    if missing:
        print(f"Cannot save aggregates; missing columns: {sorted(missing)}")
        return

    # Map DataFrame columns to DB schema names
    # Assuming table uses 'score_max' (per migration notes).
    write_df = df.rename(columns={"max_score": "score_max"}).copy()

    # Drop rows without a session_id
    write_df = write_df[write_df["session_id"].notna()]
    if write_df.empty:
        print("No valid rows (session_id missing) to write.")
        return

    # Append to leaderboard_aggregates; index not needed
    try:
        with engine.begin() as conn:
            write_df[["session_id", "event_count", "score_max"]].to_sql(
                "leaderboard_aggregates",
                con=conn,
                if_exists="append",
                index=False,
            )
        print(f"Inserted {len(write_df)} aggregate rows into leaderboard_aggregates.")
    except Exception as e:
        print(f"Failed to write aggregates via to_sql: {e}")


def main():
    engine = get_engine()

    query_sql = (
        """
        SELECT id, user_id, session_id, event_type, event_name, timestamp, payload
        FROM events
        ORDER BY timestamp DESC
        LIMIT 100
        """
    )

    with engine.connect() as conn:
        df = pd.read_sql_query(query_sql, conn)

    print(f"Loaded events DataFrame shape: {df.shape}")

    # Normalize payload JSON into top-level columns with a prefix
    if 'payload' in df.columns:
        try:
            payload_df = pd.json_normalize(df['payload'])
        except Exception:
            # Fallback: ensure we have a DataFrame even if normalization fails
            payload_df = pd.DataFrame(index=df.index)
        payload_df = payload_df.add_prefix('payload_')
        # Drop original payload and join normalized columns (aligning on index)
        df = df.drop(columns=['payload']).join(payload_df)

    # Convert timestamp to pandas datetime (UTC if possible)
    if 'timestamp' in df.columns:
        df['timestamp'] = pd.to_datetime(df['timestamp'], utc=True, errors='coerce')

    # Compute per-session aggregates:
    # - event_count: total events per session
    # - max score for events where event_type == 'score'
    if not df.empty:
        # Determine a numeric score column from payload if present
        if 'payload_score' in df.columns:
            score_numeric = pd.to_numeric(df['payload_score'], errors='coerce')
        else:
            score_numeric = pd.Series(np.nan, index=df.index)

        # Use score only for rows with event_type == 'score'
        score_mask = df['event_type'].astype(str).str.lower().eq('score')
        df['score_value'] = np.where(score_mask, score_numeric, np.nan)

        # Group by session and aggregate
        session_summary = (
            df.groupby('session_id')
              .agg(
                  event_count=('event_type', 'size'),
                  max_score=('score_value', 'max'),
              )
              .reset_index()
        )
    else:
        # Empty input -> empty aggregation result
        session_summary = pd.DataFrame(columns=['session_id', 'event_count', 'max_score'])

    # For quick visibility when running the script directly
    print(f"Session summary rows: {len(session_summary)}")

    # Persist the aggregation to Postgres (upsert by session_id)
    save_session_summary(session_summary, engine)


if __name__ == "__main__":
    main()
