# Game Analytics - Setup Instructions

## Quick Start (Without Docker)

Since Docker is not available, here are alternative setup options:

### Option 1: Install PostgreSQL Locally (Recommended for Production-like Development)

1. **Download PostgreSQL**
   - Download from: https://www.postgresql.org/download/windows/
   - Install PostgreSQL 16 or later
   - Remember the password you set for the `postgres` user

2. **Create Database**
   ```powershell
   # After installation, open PostgreSQL psql or pgAdmin and run:
   CREATE DATABASE gameanalytics_db;
   CREATE USER gameanalytics WITH PASSWORD 'password';
   GRANT ALL PRIVILEGES ON DATABASE gameanalytics_db TO gameanalytics;
   ```

3. **Configure Environment**
   ```powershell
   # Copy the example environment file
   Copy-Item .env.example .env
   
   # Edit .env and update DATABASE_URL:
   # DATABASE_URL=postgresql+asyncpg://gameanalytics:password@localhost:5432/gameanalytics_db
   ```

4. **Run Migrations**
   ```powershell
   C:/Users/likhi/Documents/AIML/PythonPro/myenv/Scripts/alembic.exe upgrade head
   ```

5. **Start the Application**
   ```powershell
   C:/Users/likhi/Documents/AIML/PythonPro/myenv/Scripts/python.exe app/main.py
   ```

### Option 2: Use SQLite for Local Development (Quick Testing)

If you want to quickly test without installing PostgreSQL:

1. **Create a local .env file**
   ```powershell
   Copy-Item .env.example .env
   ```

2. **Edit .env and change DATABASE_URL to SQLite**
   ```
   DATABASE_URL=sqlite+aiosqlite:///./gameanalytics.db
   ```

3. **Install aiosqlite**
   ```powershell
   C:/Users/likhi/Documents/AIML/PythonPro/myenv/Scripts/pip.exe install aiosqlite
   ```

4. **Run the application** (SQLite will auto-create the database)
   ```powershell
   C:/Users/likhi/Documents/AIML/PythonPro/myenv/Scripts/python.exe app/main.py
   ```

Note: SQLite is for development only. Use PostgreSQL for production.

### Option 3: Install Docker Desktop

1. Download Docker Desktop for Windows: https://www.docker.com/products/docker-desktop/
2. Install and restart your computer
3. Run: `docker compose up --build`

## Current Status

Your FastAPI application is ready but needs a database connection to run migrations.

Choose one of the options above based on your needs:
- **PostgreSQL locally** - Best for production-like development
- **SQLite** - Fastest for quick testing (limited features)
- **Docker** - Best for consistency across environments
