import React, { useEffect, useRef, useState, useCallback } from 'react';
import { FlappyBirdGame } from '../game/FlappyBird';
import analytics from '../services/analytics';

const GameCanvas = () => {
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const [sessionActive, setSessionActive] = useState(false);
  const [userId] = useState(() => {
    // Get or create user ID from localStorage
    let id = localStorage.getItem('game_user_id');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('game_user_id', id);
    }
    return id;
  });

  const handleGameEvent = useCallback((eventType, eventName, payload) => {
    // Track game events through analytics service
    analytics.trackEvent(eventType, eventName, payload);
  }, []);

  useEffect(() => {
    console.log('[GameCanvas] Initializing game...');
    
    // Set user ID in analytics
    analytics.setUserId(userId);

    // Initialize game
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error('[GameCanvas] Canvas ref not available');
      return;
    }
    
    const game = new FlappyBirdGame(canvas, handleGameEvent);
    game.init();
    gameRef.current = game;

    // Start analytics session
    const startSession = async () => {
      await analytics.startSession({
        game_name: 'flappy-analytics',
        browser: navigator.userAgent
      });
      setSessionActive(true);
    };

    startSession();

    // Cleanup
    return () => {
      console.log('[GameCanvas] Cleaning up game...');
      if (gameRef.current) {
        const finalScore = gameRef.current.score || 0;
        gameRef.current.destroy();
        gameRef.current = null;
        
        // End session on cleanup
        analytics.endSession(finalScore).catch(console.error);
        setSessionActive(false);
      }
    };
  }, [userId, handleGameEvent]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>🎮 Flappy Analytics</h1>
        <p style={styles.subtitle}>
          Real-time game analytics demo with FastAPI + React
        </p>
      </div>
      
      <div style={styles.gameContainer}>
        <canvas
          ref={canvasRef}
          style={styles.canvas}
        />
      </div>

      <div style={styles.info}>
        <div style={styles.infoCard}>
          <h3>Controls</h3>
          <p>🖱️ Click or Press SPACE to jump</p>
        </div>
        
        <div style={styles.infoCard}>
          <h3>Analytics Events</h3>
          <ul style={styles.list}>
            <li>✅ Session Start</li>
            <li>🦅 Jump Events</li>
            <li>📊 Score Updates</li>
            <li>💥 Collisions</li>
            <li>🏁 Session End</li>
          </ul>
        </div>

        <div style={styles.infoCard}>
          <h3>Session Info</h3>
          <p>User ID: <code style={styles.code}>{userId.substring(0, 8)}...</code></p>
          <p>Status: <span style={{color: sessionActive ? '#4CAF50' : '#f44336'}}>
            {sessionActive ? '🟢 Active' : '🔴 Inactive'}
          </span></p>
        </div>
      </div>

      <div style={styles.footer}>
        <p>Events are batched and sent to <code style={styles.code}>/api/v1/events</code></p>
        <p>Check <a href="http://localhost:8000/docs" target="_blank" rel="noopener noreferrer" style={styles.link}>
          API Docs
        </a> for real-time data</p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#1a1a2e',
    color: '#eee',
    padding: '20px',
    fontFamily: 'Arial, sans-serif'
  },
  header: {
    textAlign: 'center',
    marginBottom: '20px'
  },
  title: {
    fontSize: '48px',
    margin: '10px 0',
    color: '#FFD700'
  },
  subtitle: {
    fontSize: '18px',
    color: '#aaa'
  },
  gameContainer: {
    backgroundColor: '#000',
    borderRadius: '8px',
    padding: '10px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
    marginBottom: '30px'
  },
  canvas: {
    display: 'block',
    border: '2px solid #333'
  },
  info: {
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap',
    justifyContent: 'center',
    maxWidth: '1000px',
    marginBottom: '20px'
  },
  infoCard: {
    backgroundColor: '#16213e',
    padding: '20px',
    borderRadius: '8px',
    minWidth: '200px',
    border: '1px solid #0f3460'
  },
  list: {
    listStyle: 'none',
    padding: 0,
    margin: '10px 0'
  },
  code: {
    backgroundColor: '#0f3460',
    padding: '2px 6px',
    borderRadius: '4px',
    fontFamily: 'monospace',
    color: '#FFD700'
  },
  footer: {
    textAlign: 'center',
    color: '#888',
    fontSize: '14px'
  },
  link: {
    color: '#4CAF50',
    textDecoration: 'none'
  }
};

export default GameCanvas;
