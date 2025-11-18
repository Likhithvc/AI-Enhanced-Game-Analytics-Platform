"""Quick script to check event counts."""
from sqlalchemy import create_engine, text
from app.db import DATABASE_URL

engine = create_engine(DATABASE_URL.replace('postgresql+asyncpg', 'postgresql'))
conn = engine.connect()

# Check position events
result = conn.execute(text("SELECT COUNT(*) FROM events WHERE event_type = :type"), {"type": "position"})
position_count = result.scalar()

# Check all event types
result = conn.execute(text("SELECT event_type, COUNT(*) as count FROM events GROUP BY event_type"))
event_types = result.fetchall()

print(f"Position events: {position_count}")
print("\nAll event types:")
for row in event_types:
    print(f"  {row[0]}: {row[1]}")

conn.close()
