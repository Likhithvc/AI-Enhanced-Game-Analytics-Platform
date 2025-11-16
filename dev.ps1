# PowerShell wrapper for docker-compose commands
# Use this if you don't have make installed on Windows

param(
    [Parameter(Position=0)]
    [string]$Command = "help"
)

function Show-Help {
    Write-Host "Usage: .\dev.ps1 [command]" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Available commands:" -ForegroundColor Yellow
    Write-Host "  dev        - Start all services in development mode"
    Write-Host "  down       - Stop all services"
    Write-Host "  logs       - View logs from all services"
    Write-Host "  restart    - Restart all services"
    Write-Host "  clean      - Stop services and remove volumes"
    Write-Host "  migrate    - Run database migrations"
    Write-Host "  run-jobs   - Manually trigger ETL and heatmap jobs"
    Write-Host "  shell-backend - Open shell in backend container"
    Write-Host "  shell-db   - Open PostgreSQL shell"
    Write-Host "  test       - Run backend tests"
    Write-Host ""
}

switch ($Command.ToLower()) {
    "dev" {
        Write-Host "Starting all services..." -ForegroundColor Green
        docker-compose up --build
    }
    "down" {
        Write-Host "Stopping all services..." -ForegroundColor Yellow
        docker-compose down
    }
    "logs" {
        Write-Host "Viewing logs..." -ForegroundColor Cyan
        docker-compose logs -f
    }
    "restart" {
        Write-Host "Restarting services..." -ForegroundColor Yellow
        docker-compose restart
    }
    "clean" {
        Write-Host "Cleaning up containers and volumes..." -ForegroundColor Red
        docker-compose down -v
        Write-Host "Cleaned up all containers and volumes" -ForegroundColor Green
    }
    "migrate" {
        Write-Host "Running database migrations..." -ForegroundColor Cyan
        docker-compose exec backend alembic upgrade head
    }
    "run-jobs" {
        Write-Host "Triggering background jobs..." -ForegroundColor Cyan
        try {
            Invoke-RestMethod -Uri http://localhost:8000/admin/run-jobs `
                -Method POST `
                -Headers @{"x-api-key"="dev-admin-key"} `
                -ContentType "application/json" `
                -Body '{}' | ConvertTo-Json -Depth 5
        } catch {
            Write-Host "Error: Make sure services are running (.\dev.ps1 dev)" -ForegroundColor Red
        }
    }
    "shell-backend" {
        Write-Host "Opening backend shell..." -ForegroundColor Cyan
        docker-compose exec backend /bin/sh
    }
    "shell-db" {
        Write-Host "Opening PostgreSQL shell..." -ForegroundColor Cyan
        docker-compose exec db psql -U gameanalytics -d gameanalytics_db
    }
    "test" {
        Write-Host "Running backend tests..." -ForegroundColor Cyan
        docker-compose exec backend pytest -v
    }
    default {
        Show-Help
    }
}
