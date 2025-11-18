# 🎮 Game Analytics Platform - Quick Start Guide

Your analytics platform is now fully running! Here's how to test and explore everything.

## 🚀 What's Running

All services are live at:
- **Frontend (Game + Dashboard)**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Database**: PostgreSQL on port 5432
- **Redis**: Port 6379
- **Metrics**: http://localhost:8000/metrics

## 📊 Quick Test Workflow

### 1. View the Frontend

Open your browser to **http://localhost:3000**

You'll see two views:
- **Game** tab: Play Flappy Bird (events tracked in real-time)
- **Dashboard** tab: View analytics charts, leaderboard, and heatmaps

### 2. Set Up Authentication (One-Time)

The API uses JWT tokens. To enable the game to send events:

1. Get a JWT token (run in PowerShell):
```powershell
$token = (Invoke-RestMethod -Uri 'http://localhost:8000/api/v1/auth/login' -Method Post -Body @{ username='demo'; password='demo123' }).access_token
Write-Host "Token: $token"
```

2. Open http://localhost:3000 in your browser
3. Press F12 to open DevTools → Console
4. Paste this (replace `<TOKEN>` with the token from step 1):
```javascript
localStorage.setItem('access_token', '<TOKEN>');
location.reload();
```

Now the game will track sessions and events!

### 3. Play the Game

- Click the **Game** tab
- Click or press SPACE to make the bird jump
- Watch the Session Info panel show "🟢 Active"
- Events are batched and sent every 3 seconds or when 5 events accumulate

### 4. View Analytics Dashboard

Click the **Dashboard** tab to see:
- **Average Score Over Time**: Line chart showing performance trends
- **Leaderboard**: Top 10 players by best score
- **Heatmap**: Visual position tracking (enter level "1" and today's date)

### 5. Test API Endpoints

Visit **http://localhost:8000/docs** for interactive API documentation.

Try these endpoints:

#### Get Metrics
```powershell
Invoke-WebRequest http://localhost:8000/metrics
```
Shows: `events_received_total` and `sessions_created_total`

#### Get Leaderboard
```powershell
Invoke-RestMethod http://localhost:8000/api/v1/leaderboard?limit=10
```

#### Get Analytics Summary
```powershell
Invoke-RestMethod 'http://localhost:8000/api/v1/analytics/summary?from=2025-11-01&to=2025-11-30'
```

#### Export Data (Parquet)
```powershell
Invoke-WebRequest -Uri 'http://localhost:8000/api/v1/exports?from=2025-11-01&to=2025-11-30' -OutFile 'sessions_export.parquet'
```
Downloads ML-ready training data!

## 🔧 Useful Commands

### View Logs
```powershell
docker compose logs backend --tail=50
docker compose logs frontend --tail=50
```

### Restart Services
```powershell
docker compose restart backend
docker compose restart frontend
```

### Stop All Services
```powershell
docker compose down
```

### Start All Services
```powershell
docker compose up -d
```

### Create More Demo Data
```powershell
docker compose exec backend python -m scripts.populate_demo_data
```

### Create New User
```powershell
docker compose exec backend python -m scripts.seed_user --username player2 --password pass123 --email player2@example.com
```

## 📈 Background Jobs

The platform runs automated jobs:
- **ETL Job**: Every 15 minutes, aggregates session data into `leaderboard_aggregates`
- **Heatmap Job**: Every 30 minutes, generates position heatmaps for levels 1-3

Trigger jobs manually (requires admin API key):
```powershell
Invoke-RestMethod -Uri 'http://localhost:8000/admin/run-jobs' -Method Post -Headers @{ 'x-api-key' = 'dev-admin-key' }
```

## 🧪 Run Tests

```powershell
docker compose exec backend pytest tests -v
```

## 🎯 What's Been Implemented

✅ **Backend (FastAPI)**
- Session management (start/end)
- Event batching and storage
- JWT authentication
- Analytics endpoints (summary, leaderboard, heatmap)
- Data export (Parquet for ML)
- Metrics endpoint
- Background jobs (ETL, heatmap generation)
- Admin endpoints

✅ **Frontend (React + Vite)**
- Flappy Bird game with real-time event tracking
- Analytics dashboard with charts
- Leaderboard display
- Heatmap visualization
- JWT token integration

✅ **Database**
- PostgreSQL with Alembic migrations
- Users, Sessions, Events, Leaderboard tables
- Redis for caching

✅ **DevOps**
- Docker Compose orchestration
- Health checks
- Hot reload for development
- Structured logging (JSON)
- CI/CD workflow (GitHub Actions)

## 🎨 Customization Ideas

Want to extend the platform? Try:
1. Add more game event types
2. Create custom analytics queries
3. Build ML models using the exported Parquet data
4. Add user registration UI
5. Implement real-time dashboards with WebSockets
6. Add more background jobs (e.g., anomaly detection)

## 🐛 Troubleshooting

**Frontend not loading?**
```powershell
docker compose logs frontend
docker compose build frontend --no-cache
docker compose up -d frontend
```

**Backend errors?**
```powershell
docker compose logs backend
docker compose exec backend alembic upgrade head
```

**Database issues?**
```powershell
docker compose down
docker volume rm pythonpro_postgres_data
docker compose up -d
docker compose exec backend alembic upgrade head
docker compose exec backend python -m scripts.seed_user --username demo --password demo123 --email demo@example.com
```

## 📚 Architecture Overview

```
┌─────────────┐
│   Browser   │
│ (React App) │
└──────┬──────┘
       │ HTTP (JWT)
       ▼
┌─────────────┐      ┌──────────┐
│   FastAPI   │◄────►│PostgreSQL│
│   Backend   │      └──────────┘
└──────┬──────┘
       │              ┌──────────┐
       └─────────────►│  Redis   │
                      └──────────┘
       
Background Jobs:
- ETL Aggregation (15 min)
- Heatmap Generation (30 min)
```

---

**🎉 Your platform is ready!** Open http://localhost:3000 and start playing!
