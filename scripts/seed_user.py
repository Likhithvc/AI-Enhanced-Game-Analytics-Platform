import asyncio
import argparse
from sqlalchemy import select
from app.db import AsyncSessionLocal
from app.models import User
from app.auth import get_password_hash


async def upsert_user(username: str, password: str, email: str | None):
    async with AsyncSessionLocal() as session:
        res = await session.execute(select(User).where(User.username == username))
        user = res.scalars().first()
        if user:
            print(f"User exists: {user.username} id={user.id}")
            return user
        user = User(
            username=username,
            email=email,
            display_name=username,
            hashed_password=get_password_hash(password),
            meta={}
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        print(f"User created: {user.username} id={user.id}")
        return user


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--username", required=True)
    parser.add_argument("--password", required=True)
    parser.add_argument("--email", default=None)
    args = parser.parse_args()
    asyncio.run(upsert_user(args.username, args.password, args.email))


if __name__ == "__main__":
    main()
