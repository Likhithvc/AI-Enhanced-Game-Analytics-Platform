import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const Leaderboard = ({ currentUsername, limit = 10 }) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLeaderboard();
  }, [limit]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.get(`${API_URL}/api/v1/scores/leaderboard`, {
        params: { limit }
      });
      
      setLeaderboard(response.data);
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
      setError('Failed to load leaderboard. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const getRankMedal = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return rank;
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2 style={styles.title}>🏆 Leaderboard</h2>
          <div style={styles.loading}>Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2 style={styles.title}>🏆 Leaderboard</h2>
          <div style={styles.error}>{error}</div>
          <button onClick={fetchLeaderboard} style={styles.retryButton}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h2 style={styles.title}>🏆 Leaderboard</h2>
          <button onClick={fetchLeaderboard} style={styles.refreshButton}>
            🔄 Refresh
          </button>
        </div>

        {leaderboard.length === 0 ? (
          <div style={styles.emptyState}>
            <p>No scores yet. Be the first to play!</p>
          </div>
        ) : (
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.headerRow}>
                  <th style={styles.th}>Rank</th>
                  <th style={{...styles.th, textAlign: 'left'}}>Username</th>
                  <th style={styles.th}>Highest Score</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry, index) => {
                  const rank = index + 1;
                  const isCurrentUser = currentUsername && entry.username === currentUsername;
                  
                  return (
                    <tr
                      key={`${entry.username}-${index}`}
                      style={{
                        ...styles.row,
                        ...(isCurrentUser ? styles.currentUserRow : {}),
                        ...(rank <= 3 ? styles.topThreeRow : {})
                      }}
                    >
                      <td style={styles.td}>
                        <span style={styles.rank}>{getRankMedal(rank)}</span>
                      </td>
                      <td style={{...styles.td, textAlign: 'left'}}>
                        <span style={styles.username}>
                          {entry.username}
                          {isCurrentUser && <span style={styles.youBadge}> (You)</span>}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.score}>{entry.highest_score}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div style={styles.footer}>
          <p style={styles.footerText}>
            Showing top {leaderboard.length} player{leaderboard.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    minHeight: '100vh',
    backgroundColor: '#1a1a2e',
    padding: '40px 20px'
  },
  card: {
    backgroundColor: '#16213e',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    width: '100%',
    maxWidth: '700px',
    overflow: 'hidden'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '25px 30px',
    borderBottom: '2px solid #0f3460'
  },
  title: {
    color: '#FFD700',
    fontSize: '32px',
    margin: 0,
    fontWeight: '700'
  },
  refreshButton: {
    padding: '8px 16px',
    backgroundColor: '#0f3460',
    color: '#FFD700',
    border: '2px solid #FFD700',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontWeight: '600'
  },
  tableContainer: {
    overflowX: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  headerRow: {
    backgroundColor: '#0f3460',
    borderBottom: '2px solid #FFD700'
  },
  th: {
    padding: '15px 20px',
    color: '#FFD700',
    fontSize: '14px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    textAlign: 'center'
  },
  row: {
    borderBottom: '1px solid #0f3460',
    transition: 'background-color 0.2s ease'
  },
  topThreeRow: {
    backgroundColor: 'rgba(255, 215, 0, 0.05)'
  },
  currentUserRow: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    borderLeft: '4px solid #4CAF50'
  },
  td: {
    padding: '15px 20px',
    color: '#eee',
    fontSize: '16px',
    textAlign: 'center'
  },
  rank: {
    fontSize: '20px',
    fontWeight: '700'
  },
  username: {
    fontWeight: '500'
  },
  youBadge: {
    color: '#4CAF50',
    fontWeight: '700',
    fontSize: '14px'
  },
  score: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#FFD700'
  },
  footer: {
    padding: '20px 30px',
    borderTop: '2px solid #0f3460',
    textAlign: 'center'
  },
  footerText: {
    color: '#aaa',
    fontSize: '14px',
    margin: 0
  },
  loading: {
    padding: '60px 30px',
    textAlign: 'center',
    color: '#aaa',
    fontSize: '18px'
  },
  error: {
    padding: '30px',
    textAlign: 'center',
    color: '#ff4444',
    fontSize: '16px'
  },
  retryButton: {
    display: 'block',
    margin: '20px auto',
    padding: '10px 30px',
    backgroundColor: '#FFD700',
    color: '#1a1a2e',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  emptyState: {
    padding: '60px 30px',
    textAlign: 'center',
    color: '#aaa',
    fontSize: '16px'
  }
};

export default Leaderboard;
