import psycopg2
from datetime import datetime, timedelta

conn = psycopg2.connect('postgresql://gameanalytics:password@db:5432/gameanalytics_db')
cur = conn.cursor()

# Get current event count
cur.execute('SELECT COUNT(*) FROM events')
old_count = cur.fetchone()[0]
print(f'Events before: {old_count}')

# Get current game_over count
cur.execute("SELECT COUNT(*) FROM events WHERE event_name = 'game_over'")
old_game_over = cur.fetchone()[0]
print(f'Game_over events before: {old_game_over}')

# For testing, let's just check if new events come in
# Don't delete - just monitor
print("\n=== Latest 20 events (last 5 minutes) ===")
cur.execute("""
SELECT event_name, user_id, timestamp 
FROM events 
WHERE timestamp > NOW() - INTERVAL '5 minutes'
ORDER BY timestamp DESC
LIMIT 20
""")

for row in cur.fetchall():
    print(f'{row[2]}: {row[0]} by {row[1][:8]}...')

cur.close()
conn.close()
