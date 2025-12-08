import psycopg2
from datetime import datetime, timedelta

conn = psycopg2.connect('postgresql://gameanalytics:password@db:5432/gameanalytics_db')
cur = conn.cursor()

# Check events by user
print("=== Events by user ===")
cur.execute('SELECT DISTINCT user_id, COUNT(*) as cnt FROM events GROUP BY user_id')
for row in cur.fetchall():
    print(f'  User {row[0]}: {row[1]} events')

# Check recent events
print("\n=== Recent events (last 10) ===")
cur.execute('SELECT user_id, event_name, timestamp FROM events ORDER BY timestamp DESC LIMIT 10')
for row in cur.fetchall():
    print(f'  {row[2]}: {row[1]} by {row[0]}')

# Check game_over events (which have scores)
print("\n=== Game over events ===")
cur.execute("SELECT COUNT(*) FROM events WHERE event_name = 'game_over'")
game_over_count = cur.fetchone()[0]
print(f'  Total game_over events: {game_over_count}')

# Check if game_over events have final_score in payload
print("\n=== Sample game_over events ===")
cur.execute("SELECT user_id, payload, timestamp FROM events WHERE event_name = 'game_over' LIMIT 5")
for row in cur.fetchall():
    print(f'  User: {row[0]}, Payload: {row[1]}, Time: {row[2]}')

# Check summary data manually for the last 7 days
print("\n=== Summary for last 7 days (all users) ===")
sql = """
SELECT
  DATE(timestamp) AS day,
  COUNT(*) FILTER (WHERE event_name = 'game_over') AS games_played,
  AVG( (payload->>'final_score')::float ) FILTER (WHERE event_name = 'game_over') AS avg_score
FROM events
WHERE timestamp >= NOW() - INTERVAL '7 days'
GROUP BY day
ORDER BY day
"""
cur.execute(sql)
for row in cur.fetchall():
    print(f'  {row[0]}: {row[1]} games, avg score: {row[2]}')

cur.close()
conn.close()
print("\nDone!")
