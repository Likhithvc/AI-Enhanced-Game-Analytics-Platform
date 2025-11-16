# Background Jobs & Scheduler

This project uses **APScheduler** to run periodic ETL and heatmap generation jobs.

## Features

- **Automated ETL**: Runs every 15 minutes (configurable via `ETL_INTERVAL_MINUTES` env var)
- **Automated Heatmap**: Runs every 30 minutes (configurable via `HEATMAP_INTERVAL_MINUTES` env var)
- **Manual Trigger**: Admin API endpoint to run jobs on-demand

## Configuration

Set these environment variables in `.env` or your deployment:

```bash
# Job intervals (minutes)
ETL_INTERVAL_MINUTES=15
HEATMAP_INTERVAL_MINUTES=30

# Heatmap levels (comma-separated)
HEATMAP_LEVELS=1,2,3

# Admin API key for manual job triggers
ADMIN_API_KEY=your-secure-key-here
```

## Manual Job Trigger

### Endpoint
```
POST /admin/run-jobs
```

### Authentication
Provide API key via header:
```
x-api-key: your-secure-key-here
```

### Request Body (optional)
```json
{
  "tasks": ["etl", "heatmap"],
  "levels": ["1", "2"],
  "date": "2025-11-16"
}
```

- `tasks`: Array of job names to run (default: `["etl", "heatmap"]`)
- `levels`: Heatmap levels to process (default: from `HEATMAP_LEVELS` env)
- `date`: YYYY-MM-DD date for heatmap (default: today UTC)

### Example (PowerShell)
```powershell
# Run all jobs (ETL + heatmap for today)
Invoke-RestMethod -Uri http://localhost:8000/admin/run-jobs `
  -Method POST `
  -Headers @{"x-api-key"="dev-admin-key"} `
  -ContentType 'application/json' `
  -Body '{}'

# Run only ETL
Invoke-RestMethod -Uri http://localhost:8000/admin/run-jobs `
  -Method POST `
  -Headers @{"x-api-key"="dev-admin-key"} `
  -ContentType 'application/json' `
  -Body '{"tasks":["etl"]}'

# Run heatmap for specific levels and date
Invoke-RestMethod -Uri http://localhost:8000/admin/run-jobs `
  -Method POST `
  -Headers @{"x-api-key"="dev-admin-key"} `
  -ContentType 'application/json' `
  -Body '{"tasks":["heatmap"],"levels":["1","2"],"date":"2025-11-15"}'
```

### Example (curl)
```bash
# Run all jobs
curl -X POST http://localhost:8000/admin/run-jobs \
  -H "x-api-key: dev-admin-key" \
  -H "Content-Type: application/json" \
  -d '{}'

# Run only heatmap
curl -X POST http://localhost:8000/admin/run-jobs \
  -H "x-api-key: dev-admin-key" \
  -H "Content-Type: application/json" \
  -d '{"tasks":["heatmap"],"levels":["1"]}'
```

## Response
```json
{
  "status": "ok",
  "results": [
    {
      "status": "ok",
      "job": "etl"
    },
    {
      "status": "ok",
      "job": "heatmap",
      "results": [
        {
          "level": "1",
          "date": "2025-11-16",
          "sum": 30.0
        }
      ]
    }
  ]
}
```

## Scheduler Logs

APScheduler logs job execution at INFO level. Look for:
```
apscheduler.scheduler - INFO - Adding job "run_etl_job" to job store "default"
apscheduler.scheduler - INFO - Scheduler started
```

## Production Deployment

For production, consider:
1. **Redis + Celery**: For distributed task execution and result tracking
2. **Task Queue**: RabbitMQ or AWS SQS for better reliability
3. **Monitoring**: Track job success/failure rates via Prometheus/Datadog
4. **Resource Limits**: Configure max instances and coalescing in `app/jobs.py`

Current setup uses APScheduler's `AsyncIOScheduler` with:
- `max_instances=1`: Only one instance of each job runs at a time
- `coalesce=True`: Missed runs are coalesced into one execution
