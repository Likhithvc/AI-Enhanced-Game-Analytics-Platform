# Game Analytics

A full-stack game analytics platform for tracking and analyzing player behavior, game metrics, and performance data.

## Purpose

Game Analytics provides real-time insights into player engagement, retention metrics, game performance, and behavioral patterns. The platform enables game developers to make data-driven decisions to improve gameplay experience and optimize game mechanics.

## Tech Stack

### Backend
- **FastAPI** - High-performance Python web framework for building RESTful APIs
- **PostgreSQL** - Robust relational database for storing analytics data
- **SQLAlchemy** - ORM for database interactions
- **Alembic** - Database migration management

### Frontend
- **React** - Modern JavaScript library for building user interfaces
- **Vite** - Fast build tool and development server
- **React Router** - Client-side routing
- **Axios** - HTTP client for API requests
- **Chart.js / Recharts** - Data visualization

### Infrastructure
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Redis** - In-memory cache and job queue backend
- **Nginx** - Reverse proxy and static file serving (production)

## Architecture

The application follows a three-tier architecture:

1. **Frontend Layer**: React SPA that communicates with the backend via REST API
2. **Backend Layer**: FastAPI application handling business logic, data processing, and API endpoints
3. **Data Layer**: PostgreSQL database storing analytics events, user data, and aggregated metrics
4. **Cache Layer**: Redis for job queuing and caching

```
┌─────────────────┐
│  React Frontend │
│   (Port 3000)   │
└────────┬────────┘
         │ HTTP/REST
         ▼
┌─────────────────┐       ┌─────────────────┐
│  FastAPI Backend│◄─────►│     Redis       │
│   (Port 8000)   │       │   (Port 6379)   │
└────────┬────────┘       └─────────────────┘
         │ SQLAlchemy
         ▼
┌─────────────────┐
│   PostgreSQL    │
│   (Port 5432)   │
└─────────────────┘
```

## Getting Started

### Prerequisites
- Docker and Docker Compose installed
- Git

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd game-analytics
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```
   # Database
   POSTGRES_USER=gameanalytics
   POSTGRES_PASSWORD=your_secure_password
   POSTGRES_DB=gameanalytics_db
   
   # Backend
   DATABASE_URL=postgresql+asyncpg://gameanalytics:your_secure_password@db:5432/gameanalytics_db
   REDIS_URL=redis://redis:6379/0
   SECRET_KEY=your_secret_key_here
   ADMIN_API_KEY=your_admin_api_key
   ETL_INTERVAL_MINUTES=15
   HEATMAP_INTERVAL_MINUTES=30
   HEATMAP_LEVELS=1,2,3
   
   # Frontend
   VITE_API_URL=http://localhost:8000
   ```

3. **Start all services**
   ```bash
   # Using make (recommended)
   make dev
   
   # Or using docker-compose directly
   docker-compose up --build
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs
   - Redis: localhost:6379

### Running Individual Services

**Backend + Database + Redis:**
```bash
docker-compose up backend db redis
```

**Frontend only:**
```bash
docker-compose up frontend
```

### Quick Commands (Make)

**Linux/Mac:**
```bash
# Start all services in development mode
make dev

# Stop all services
make down

# View logs
make logs

# Restart services
make restart

# Clean up (remove containers and volumes)
make clean

# Run database migrations
make migrate

# Trigger background jobs manually
make run-jobs
```

**Windows (PowerShell):**
```powershell
# If make is not installed, use the PowerShell wrapper
.\dev.ps1 dev        # Start all services
.\dev.ps1 down       # Stop all services
.\dev.ps1 logs       # View logs
.\dev.ps1 clean      # Clean up
.\dev.ps1 migrate    # Run migrations
.\dev.ps1 run-jobs   # Trigger jobs
```

### Database Migrations

Run migrations inside the backend container:
```bash
docker-compose exec backend alembic upgrade head
```

Create a new migration:
```bash
docker-compose exec backend alembic revision --autogenerate -m "Description"
```

### Stopping the Application

```bash
docker-compose down
```

To remove volumes (database data):
```bash
docker-compose down -v
```

## Development

### Backend Development
- API endpoints are defined in `backend/app/api/`
- Database models in `backend/app/models/`
- Business logic in `backend/app/services/`

### Frontend Development
- Components in `frontend/src/components/`
- Pages in `frontend/src/pages/`
- API calls in `frontend/src/services/`

## Testing

**Backend tests:**
```bash
docker-compose exec backend pytest
```

**Frontend tests:**
```bash
docker-compose exec frontend npm test
```

## License

MIT License
