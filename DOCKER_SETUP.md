# Docker Setup - Quick Reference

## Services Overview

| Service    | Container Name           | Port  | Purpose                          |
|------------|-------------------------|-------|----------------------------------|
| `db`       | gameanalytics-db        | 5432  | PostgreSQL database              |
| `redis`    | gameanalytics-redis     | 6379  | Cache & job queue                |
| `backend`  | gameanalytics-backend   | 8000  | FastAPI application              |
| `frontend` | gameanalytics-frontend  | 3000  | React development server         |

## Network
- **Name**: `gameanalytics-network`
- **Type**: bridge
- All services communicate via internal DNS (service names)

## Volumes
- `postgres_data` - PostgreSQL data persistence
- `redis_data` - Redis data persistence

## Environment Variables (Backend)

```bash
DATABASE_URL=postgresql+asyncpg://gameanalytics:password@db:5432/gameanalytics_db
REDIS_URL=redis://redis:6379/0
ETL_INTERVAL_MINUTES=15
HEATMAP_INTERVAL_MINUTES=30
HEATMAP_LEVELS=1,2,3
ADMIN_API_KEY=dev-admin-key
```

## Common Commands

```bash
# Start everything
make dev
# or
docker-compose up --build

# Stop everything
make down
# or
docker-compose down

# View logs
make logs
# or
docker-compose logs -f

# Clean up (including volumes)
make clean
# or
docker-compose down -v

# Run migrations
make migrate
# or
docker-compose exec backend alembic upgrade head

# Trigger background jobs
make run-jobs
# or
curl -X POST http://localhost:8000/admin/run-jobs \
  -H "x-api-key: dev-admin-key" \
  -H "Content-Type: application/json" \
  -d '{}'

# Backend shell
make shell-backend
# or
docker-compose exec backend /bin/sh

# Database shell
make shell-db
# or
docker-compose exec db psql -U gameanalytics -d gameanalytics_db
```

## Health Checks

All services include health checks:
- **PostgreSQL**: `pg_isready -U gameanalytics`
- **Redis**: `redis-cli ping`
- Backend waits for DB & Redis to be healthy

## Development Workflow

1. Make code changes (hot reload enabled via volumes)
2. Changes auto-reload in both backend and frontend
3. Database changes require migrations:
   ```bash
   docker-compose exec backend alembic revision --autogenerate -m "description"
   docker-compose exec backend alembic upgrade head
   ```

## Production Considerations

- Change `ADMIN_API_KEY` to a strong secret
- Change `SECRET_KEY` to a cryptographically secure value
- Change database password
- Set `DEBUG=False`
- Use proper volume mount paths
- Configure Redis persistence (RDB/AOF)
- Add Nginx reverse proxy
- Use Docker secrets for sensitive data
- Configure resource limits
