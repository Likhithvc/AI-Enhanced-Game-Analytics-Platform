import React, { useEffect, useRef, useState, useCallback } from 'react';
import { FlappyBirdGame } from '../game/FlappyBird';
import analytics from '../services/analytics';
import { submitScore } from '../services/api';
import { isAuthenticated } from '../services/auth';

const GameCanvas = () => {
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const gameOverRef = useRef(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [currentScore, setCurrentScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
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
    
    // Update score display during gameplay
    if (eventName === 'score_update' && payload.score !== undefined) {
      setCurrentScore(payload.score);
    }
    
    // Handle game over event to submit score
    if (eventName === 'game_over' && payload.final_score !== undefined) {
      gameOverRef.current = true;
      setCurrentScore(payload.final_score);
      if (payload.high_score !== undefined) {
        setHighScore(payload.high_score);
      }
      setIsGameOver(true);
      // Flush any pending events immediately when game ends
      analytics.flush();
      handleGameOver(payload.final_score);
    }
  }, []);

  const handleGameOver = async (finalScore) => {
    console.log('[GameCanvas] Game Over - Final Score:', finalScore);
    
    // Only submit score if user is authenticated
    if (!isAuthenticated()) {
      console.log('[GameCanvas] User not authenticated, skipping score submission');
      return;
    }

    try {
      const result = await submitScore(finalScore);
      
      if (result.new_record) {
        console.log(`🎉 NEW RECORD! Highest score: ${result.highest_score}`);
        // You could show a toast/notification here
      } else {
        console.log(`Final score: ${finalScore}, Highest score: ${result.highest_score}`);
      }
    } catch (error) {
      console.error('[GameCanvas] Failed to submit score:', error);
      if (error.response?.status === 401) {
        console.log('[GameCanvas] Authentication required for score submission');
      }
    }
  };

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
    
    // Add click and keydown handlers to dismiss game over before game processes it
    const handleInteraction = (e) => {
      if (gameOverRef.current) {
        // Prevent the event from reaching the game if game is over
        if (e.type === 'keydown' && (e.key === ' ' || e.code === 'Space')) {
          e.preventDefault();
        }
        gameOverRef.current = false;
        setIsGameOver(false);
        setCurrentScore(0);
      }
    };
    
    canvas.addEventListener('click', handleInteraction);
    window.addEventListener('keydown', handleInteraction, true); // Use capture phase
    
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
      canvas.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction, true);
      
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
      <div style={styles.mainContent}>
        <div style={styles.header}>
          <div style={styles.titleRow}>
            <h1 style={styles.title}>🎮 Flappy Analytics</h1>
            <div style={styles.scoreBoard}>
              <div style={styles.scoreItem}>
                <div style={styles.scoreLabel}>Score</div>
                <div style={styles.scoreValue}>{currentScore}</div>
              </div>
              <div style={styles.scoreItem}>
                <div style={styles.scoreLabel}>Best</div>
                <div style={styles.scoreValue}>{highScore}</div>
              </div>
            </div>
          </div>
        </div>
        
        <div style={styles.gameContainer}>
          <canvas
            ref={canvasRef}
            style={styles.canvas}
          />
          {isGameOver && (
            <div style={styles.gameOverOverlay}>
              <div style={styles.gameOverBox}>
                <h2 style={styles.gameOverTitle}>Game Over!</h2>
                <div style={styles.gameOverScores}>
                  <div style={styles.gameOverScoreItem}>
                    <div style={styles.gameOverLabel}>Your Score</div>
                    <div style={styles.gameOverValue}>{currentScore}</div>
                  </div>
                  <div style={styles.gameOverScoreItem}>
                    <div style={styles.gameOverLabel}>Best Score</div>
                    <div style={styles.gameOverValue}>{highScore}</div>
                  </div>
                </div>
                <div style={styles.gameOverHint}>Press SPACE to play again</div>
              </div>
            </div>
          )}
        </div>
        
        <div style={styles.footer}>
          <div style={styles.controlHint}>🖱️ Click or ⌨️ SPACE to jump</div>
          <div style={styles.statusBadge}>
            <span style={{color: sessionActive ? '#4CAF50' : '#f44336'}}>●</span>
            {sessionActive ? ' Live' : ' Offline'}
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#0a0e27',
    color: '#eee',
    padding: '10px',
    fontFamily: '\'Segoe UI\', Tahoma, Geneva, Verdana, sans-serif',
    overflow: 'hidden'
  },
  mainContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: '100%',
    width: '100%',
    maxHeight: '100vh',
    gap: '10px'
  },
  header: {
    textAlign: 'center',
    width: '100%'
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '15px',
    maxWidth: '650px',
    margin: '0 auto',
    padding: '0 10px'
  },
  title: {
    fontSize: 'clamp(24px, 4vw, 36px)',
    margin: '0',
    color: '#FFD700',
    textShadow: '0 0 15px rgba(255, 215, 0, 0.5)',
    fontWeight: 'bold',
    flex: '1',
    minWidth: '200px'
  },
  scoreBoard: {
    display: 'flex',
    gap: '20px',
    padding: '8px 20px',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: '8px',
    border: '2px solid rgba(255, 215, 0, 0.3)'
  },
  scoreItem: {
    textAlign: 'center'
  },
  scoreLabel: {
    fontSize: '11px',
    color: '#FFD700',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginBottom: '2px',
    fontWeight: '600'
  },
  scoreValue: {
    fontSize: 'clamp(24px, 5vw, 32px)',
    color: '#fff',
    fontWeight: 'bold',
    textShadow: '0 2px 10px rgba(255, 215, 0, 0.5)',
    lineHeight: '1'
  },
  gameContainer: {
    position: 'relative',
    backgroundColor: '#000',
    borderRadius: '8px',
    padding: '5px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.8), 0 0 0 2px rgba(255, 215, 0, 0.2)',
    border: '2px solid #1a1a2e',
    maxWidth: '100%'
  },
  canvas: {
    display: 'block',
    borderRadius: '6px',
    maxWidth: '100%',
    height: 'auto'
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '20px',
    flexWrap: 'wrap'
  },
  controlHint: {
    fontSize: 'clamp(12px, 2vw, 14px)',
    color: '#888',
    padding: '6px 15px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '6px',
    border: '1px solid rgba(255, 255, 255, 0.1)'
  },
  statusBadge: {
    fontSize: 'clamp(12px, 2vw, 14px)',
    color: '#aaa',
    padding: '6px 15px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '6px',
    border: '1px solid rgba(255, 255, 255, 0.1)'
  },
  gameOverOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '6px',
    backdropFilter: 'blur(3px)'
  },
  gameOverBox: {
    textAlign: 'center',
    padding: '30px',
    backgroundColor: 'rgba(26, 26, 46, 0.95)',
    borderRadius: '12px',
    border: '3px solid rgba(255, 215, 0, 0.5)',
    boxShadow: '0 10px 40px rgba(255, 215, 0, 0.3)'
  },
  gameOverTitle: {
    fontSize: 'clamp(28px, 6vw, 42px)',
    color: '#FFD700',
    margin: '0 0 20px 0',
    textShadow: '0 0 20px rgba(255, 215, 0, 0.8)',
    fontWeight: 'bold'
  },
  gameOverScores: {
    display: 'flex',
    gap: '30px',
    justifyContent: 'center',
    marginBottom: '20px'
  },
  gameOverScoreItem: {
    textAlign: 'center'
  },
  gameOverLabel: {
    fontSize: 'clamp(12px, 2vw, 14px)',
    color: '#aaa',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginBottom: '8px'
  },
  gameOverValue: {
    fontSize: 'clamp(32px, 8vw, 48px)',
    color: '#fff',
    fontWeight: 'bold',
    textShadow: '0 2px 15px rgba(255, 215, 0, 0.6)'
  },
  gameOverHint: {
    fontSize: 'clamp(12px, 2vw, 14px)',
    color: '#888',
    marginTop: '15px',
    padding: '8px 15px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '6px'
  }
};

export default GameCanvas;
