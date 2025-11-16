.PHONY: help dev down logs restart clean migrate run-jobs shell-backend shell-db test

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

dev: ## Start all services in development mode
	docker-compose up --build

down: ## Stop all services
	docker-compose down

logs: ## View logs from all services
	docker-compose logs -f

restart: ## Restart all services
	docker-compose restart

clean: ## Stop services and remove volumes
	docker-compose down -v
	@echo "Cleaned up all containers and volumes"

migrate: ## Run database migrations
	docker-compose exec backend alembic upgrade head

run-jobs: ## Manually trigger ETL and heatmap jobs
	@echo "Triggering background jobs..."
	@curl -X POST http://localhost:8000/admin/run-jobs \
		-H "x-api-key: dev-admin-key" \
		-H "Content-Type: application/json" \
		-d '{}' || echo "\nMake sure services are running (make dev)"

shell-backend: ## Open a shell in the backend container
	docker-compose exec backend /bin/sh

shell-db: ## Open PostgreSQL shell
	docker-compose exec db psql -U gameanalytics -d gameanalytics_db

test: ## Run backend tests
	docker-compose exec backend pytest -v
