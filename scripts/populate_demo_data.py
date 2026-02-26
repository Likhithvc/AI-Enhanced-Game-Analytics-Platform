"""
Demo script to populate analytics data for testing.
Creates sample sessions, events, and game plays.
"""
import asyncio
import random
from datetime import datetime, timedelta
from sqlalchemy import select
from app.db import AsyncSessionLocal
from app.models import User, Session, Event
from app.auth import get_password_hash


async def create_demo_data():
    async with AsyncSessionLocal() as db:
        # Get or create demo user
        result = await db.execute(select(User).where(User.username == 'demo'))
        user = result.scalars().first()

        if not user:
            user = User(
                username='demo',
                email='demo@example.com',
                display_name='Demo Player',
                hashed_password=get_password_hash('demo123'),
                meta={}
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)

        print(f"Using user: {user.username} (id={user.id})")

        # Create 5 sample sessions over the past week
        sessions_created = []
        for i in range(5):
            start_time = datetime.utcnow() - timedelta(days=random.randint(0, 7), hours=random.randint(0, 23))
            duration = random.randint(60, 300)
            end_time = start_time + timedelta(seconds=duration)
            final_score = random.randint(10, 100)

            session = Session(
                user_id=user.id,
                session_start=start_time,
                session_end=end_time,
                duration_seconds=duration,
                platform='web',
                game_version='1.0.0',
                device_info={'browser': 'Chrome'},
                meta={'final_score': final_score}
            )
            db.add(session)
            sessions_created.append((session, final_score))

        await db.commit()

        # Create events for each session
        event_types = [
            ('jump', 'player_jump'),
            ('move', 'player_move'),
            ('score', 'score_update'),
            ('collision', 'pipe_collision'),
            ('position', 'player_position')  # Add position events
        ]

        for session, final_score in sessions_created:
            await db.refresh(session)
            num_events = random.randint(20, 50)

            for j in range(num_events):
                event_type, event_name = random.choice(event_types)
                timestamp = session.session_start + timedelta(seconds=random.randint(0, session.duration_seconds or 60))

                event = Event(
                    user_id=user.id,
                    session_id=session.id,
                    event_type=event_type,
                    event_name=event_name,
                    event_category='gameplay',
                    payload={
                        'x': random.randint(50, 750),
                        'y': random.randint(50, 550),
                        'score': random.randint(0, final_score),
                        'level': '1'  # Add level for heatmap filtering
                    },
                    timestamp=timestamp
                )
                db.add(event)

        await db.commit()
        print(f"Created {len(sessions_created)} sessions with events")
        print("Demo data populated successfully!")


if __name__ == "__main__":
    asyncio.run(create_demo_data())
