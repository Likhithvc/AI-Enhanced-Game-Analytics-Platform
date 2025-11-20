import React, { useState, useEffect } from 'react';
import GameCanvas from './components/GameCanvas';
import Dashboard from './pages/Dashboard.jsx';
import AuthForm from './components/AuthForm';
import Leaderboard from './components/Leaderboard';
import { isAuthenticated, clearAuth } from './services/auth';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function App() {
  const [view, setView] = useState('game');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Check if user is authenticated on mount
    if (isAuthenticated()) {
      setIsLoggedIn(true);
      fetchCurrentUser();
    }
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/v1/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurrentUser(response.data);
    } catch (error) {
      console.error('Failed to fetch current user:', error);
      // If token is invalid, clear it
      if (error.response?.status === 401) {
        handleLogout();
      }
    }
  };

  const handleLoginSuccess = (token) => {
    setIsLoggedIn(true);
    fetchCurrentUser();
    setView('game');
  };

  const handleLogout = () => {
    clearAuth();
    setIsLoggedIn(false);
    setCurrentUser(null);
    setView('auth');
  };

  // If not logged in, show auth form
  if (!isLoggedIn) {
    return <AuthForm onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="App" style={styles.app}>
      <nav style={styles.nav}>
        <div style={styles.navContent}>
          <div style={styles.navLeft}>
            <h1 style={styles.logo}>🎮 Flappy Analytics</h1>
          </div>
          
          <div style={styles.navCenter}>
            <button 
              onClick={() => setView('game')} 
              style={{...styles.navButton, ...(view === 'game' ? styles.activeButton : {})}}
            >
              🎮 Game
            </button>
            <button 
              onClick={() => setView('dashboard')} 
              style={{...styles.navButton, ...(view === 'dashboard' ? styles.activeButton : {})}}
            >
              📊 Dashboard
            </button>
            <button 
              onClick={() => setView('leaderboard')} 
              style={{...styles.navButton, ...(view === 'leaderboard' ? styles.activeButton : {})}}
            >
              🏆 Leaderboard
            </button>
          </div>

          <div style={styles.navRight}>
            {currentUser && (
              <span style={styles.username}>
                👤 {currentUser.username}
              </span>
            )}
            <button onClick={handleLogout} style={styles.logoutButton}>
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div style={styles.content}>
        {view === 'game' && <GameCanvas />}
        {view === 'dashboard' && <Dashboard />}
        {view === 'leaderboard' && <Leaderboard currentUsername={currentUser?.username} />}
      </div>
    </div>
  );
}

const styles = {
  app: {
    minHeight: '100vh',
    backgroundColor: '#1a1a2e'
  },
  nav: {
    backgroundColor: '#16213e',
    borderBottom: '2px solid #0f3460',
    padding: '0 20px',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)'
  },
  navContent: {
    maxWidth: '1400px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px 0'
  },
  navLeft: {
    flex: 1
  },
  logo: {
    color: '#FFD700',
    fontSize: '24px',
    margin: 0,
    fontWeight: '700'
  },
  navCenter: {
    display: 'flex',
    gap: '10px',
    flex: 1,
    justifyContent: 'center'
  },
  navButton: {
    padding: '10px 20px',
    backgroundColor: 'transparent',
    color: '#eee',
    border: '2px solid transparent',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  },
  activeButton: {
    backgroundColor: '#0f3460',
    borderColor: '#FFD700',
    color: '#FFD700'
  },
  navRight: {
    flex: 1,
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: '15px'
  },
  username: {
    color: '#FFD700',
    fontSize: '16px',
    fontWeight: '600'
  },
  logoutButton: {
    padding: '8px 20px',
    backgroundColor: '#ff4444',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  },
  content: {
    minHeight: 'calc(100vh - 80px)'
  }
};

export default App;
