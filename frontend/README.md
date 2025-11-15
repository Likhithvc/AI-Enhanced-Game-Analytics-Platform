# Game Analytics Platform - Frontend

React + Vite frontend for the Game Analytics platform featuring a Flappy Bird game with real-time analytics tracking.

## Features

- 🎮 Flappy Bird game built with HTML Canvas and vanilla JavaScript
- 📊 Real-time analytics event tracking
- 📦 Batched event sending to backend API
- ⚙️ Configurable backend URL via environment variables
- 🎯 Tracks: session_start, jump, score_update, collision, session_end

## Getting Started

### Prerequisites
- Node.js 18+ and npm

### Installation

```bash
cd frontend
npm install
```

### Environment Configuration

Copy the example environment file:
```bash
cp .env.example .env
```

Edit `.env` to configure the backend API URL:
```
VITE_API_URL=http://localhost:8000
```

### Development

```bash
npm run dev
```

The app will be available at http://localhost:3000

### Build for Production

```bash
npm run build
npm run preview
```

## Analytics Events

The game tracks the following events:

| Event Type | Event Name | Description |
|------------|------------|-------------|
| `session` | `session_start` | Game session begins |
| `jump` | `player_jump` | Player jumps |
| `score` | `score_update` | Score increases |
| `collision` | `game_over` | Player collides with pipe or boundary |
| `session` | `session_end` | Game session ends |

Events are batched and sent to `/api/v1/events` endpoint in groups of 5 or every 3 seconds.

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   └── GameCanvas.jsx       # React component wrapper
│   ├── game/
│   │   └── FlappyBird.js        # Game logic (vanilla JS)
│   ├── services/
│   │   └── analytics.js         # Analytics service
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── vite.config.js
└── package.json
```

## How It Works

1. **User ID Generation**: Each player gets a unique UUID stored in localStorage
2. **Session Management**: Sessions are created via `/api/v1/sessions/start`
3. **Event Batching**: Events are queued and sent in batches to optimize network requests
4. **Session End**: When game ends, session is closed via `/api/v1/sessions/end`

## Docker

The frontend is included in the main docker-compose.yml. To run:

```bash
# From project root
docker compose up frontend
```
