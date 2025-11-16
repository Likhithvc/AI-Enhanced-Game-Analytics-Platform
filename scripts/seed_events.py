import os
import uuid
from datetime import datetime, timedelta

import psycopg2
from psycopg2.extras import Json


def get_conn_params():
    host = os.getenv("PGHOST", "localhost")
    port = int(os.getenv("PGPORT", "5432"))
    dbname = os.getenv("PGDATABASE", "gameanalytics_db")
    user = os.getenv("PGUSER", "gameanalytics")
    password = os.getenv("PGPASSWORD", "password")
    return dict(host=host, port=port, dbname=dbname, user=user, password=password)


def main():
    params = get_conn_params()
    print(f"Connecting to PostgreSQL at {params['host']}:{params['port']} db={params['dbname']}")

    conn = psycopg2.connect(**params)
    conn.autocommit = False
    try:
        cur = conn.cursor()

        # Create a user
        user_id = uuid.uuid4()
        username = f"player_{str(user_id)[:8]}"
        cur.execute(
            """
            INSERT INTO users (id, username, email, display_name, meta)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (id) DO NOTHING
            """,
            (str(user_id), username, None, username, None),
        )

        # Create a session
        session_id = uuid.uuid4()
        start = datetime.utcnow() - timedelta(minutes=5)
        end = datetime.utcnow()
        cur.execute(
            """
            INSERT INTO sessions (
                id, user_id, session_start, session_end, duration_seconds,
                game_version, platform, device_info, meta
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                str(session_id), str(user_id), start, end, int((end - start).total_seconds()),
                "1.0.0", "web", None, Json({"final_score": 37}),
            ),
        )

        # Create a handful of events including x/y and game_over
        now = datetime.utcnow()
        events = []
        for i in range(30):
            ts = now - timedelta(seconds=30 - i)
            x = (i % 10) / 10.0
            y = ((i * 3) % 10) / 10.0
            events.append(
                (
                    str(uuid.uuid4()),
                    str(user_id),
                    str(session_id),
                    "input",
                    "move",
                    "gameplay",
                    Json({"x": x, "y": y}),
                    ts,
                )
            )

        # Final game_over event with final_score
        events.append(
            (
                str(uuid.uuid4()),
                str(user_id),
                str(session_id),
                "lifecycle",
                "game_over",
                "session",
                Json({"final_score": 37}),
                now,
            )
        )

        cur.executemany(
            """
            INSERT INTO events (
                id, user_id, session_id, event_type, event_name, event_category, payload, timestamp
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """,
            events,
        )

        conn.commit()
        print(f"Seeded user={user_id}, session={session_id}, events={len(events)}")
    except Exception as e:
        conn.rollback()
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    main()
