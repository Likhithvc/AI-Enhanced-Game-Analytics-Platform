import React, { useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const AuthForm = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      if (mode === 'register') {
        // Register new user
        const response = await axios.post(`${API_URL}/api/v1/auth/register`, {
          username,
          password
        });
        
        setSuccessMessage(`Account created successfully! Welcome, ${response.data.username}!`);
        
        // Auto-login after successful registration
        setTimeout(() => {
          setMode('login');
          setSuccessMessage('');
        }, 2000);
        
      } else {
        // Login existing user
        const response = await axios.post(`${API_URL}/api/v1/auth/login`, {
          username,
          password
        });
        
        // Store token in localStorage
        localStorage.setItem('token', response.data.access_token);
        
        setSuccessMessage('Login successful!');
        
        // Notify parent component
        if (onLoginSuccess) {
          setTimeout(() => {
            onLoginSuccess(response.data.access_token);
          }, 500);
        }
      }
      
      // Clear form
      setUsername('');
      setPassword('');
      
    } catch (err) {
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else if (err.response?.status === 400) {
        setError('Username already exists. Please choose a different username.');
      } else if (err.response?.status === 401) {
        setError('Invalid username or password.');
      } else {
        setError('An error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
    setSuccessMessage('');
    setUsername('');
    setPassword('');
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.tabContainer}>
          <button
            style={{
              ...styles.tab,
              ...(mode === 'login' ? styles.activeTab : {})
            }}
            onClick={() => {
              setMode('login');
              setError('');
              setSuccessMessage('');
            }}
          >
            Login
          </button>
          <button
            style={{
              ...styles.tab,
              ...(mode === 'register' ? styles.activeTab : {})
            }}
            onClick={() => {
              setMode('register');
              setError('');
              setSuccessMessage('');
            }}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <h2 style={styles.title}>
            {mode === 'login' ? 'Welcome Back!' : 'Create Account'}
          </h2>

          {error && (
            <div style={styles.errorMessage}>
              ⚠️ {error}
            </div>
          )}

          {successMessage && (
            <div style={styles.successMessage}>
              ✅ {successMessage}
            </div>
          )}

          <div style={styles.inputGroup}>
            <label style={styles.label}>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
              minLength={3}
              style={styles.input}
              disabled={loading}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              minLength={6}
              style={styles.input}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            style={{
              ...styles.submitButton,
              ...(loading ? styles.submitButtonDisabled : {})
            }}
            disabled={loading}
          >
            {loading ? 'Processing...' : mode === 'login' ? 'Login' : 'Register'}
          </button>

          <p style={styles.toggleText}>
            {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
            <span onClick={toggleMode} style={styles.toggleLink}>
              {mode === 'login' ? 'Register here' : 'Login here'}
            </span>
          </p>
        </form>
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
    backgroundColor: '#1a1a2e',
    padding: '20px'
  },
  card: {
    backgroundColor: '#16213e',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    width: '100%',
    maxWidth: '450px',
    overflow: 'hidden'
  },
  tabContainer: {
    display: 'flex',
    borderBottom: '2px solid #0f3460'
  },
  tab: {
    flex: 1,
    padding: '15px',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#aaa',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    outline: 'none'
  },
  activeTab: {
    color: '#FFD700',
    backgroundColor: '#0f3460',
    borderBottom: '3px solid #FFD700'
  },
  form: {
    padding: '30px'
  },
  title: {
    color: '#FFD700',
    fontSize: '28px',
    marginBottom: '25px',
    textAlign: 'center'
  },
  inputGroup: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    color: '#eee',
    fontSize: '14px',
    marginBottom: '8px',
    fontWeight: '500'
  },
  input: {
    width: '100%',
    padding: '12px 15px',
    backgroundColor: '#0f3460',
    border: '2px solid #1a1a2e',
    borderRadius: '6px',
    color: '#fff',
    fontSize: '15px',
    outline: 'none',
    transition: 'border-color 0.3s ease',
    boxSizing: 'border-box'
  },
  submitButton: {
    width: '100%',
    padding: '14px',
    backgroundColor: '#FFD700',
    color: '#1a1a2e',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    marginTop: '10px'
  },
  submitButtonDisabled: {
    backgroundColor: '#888',
    cursor: 'not-allowed'
  },
  toggleText: {
    textAlign: 'center',
    color: '#aaa',
    fontSize: '14px',
    marginTop: '20px'
  },
  toggleLink: {
    color: '#FFD700',
    cursor: 'pointer',
    textDecoration: 'underline',
    fontWeight: '500'
  },
  errorMessage: {
    backgroundColor: '#ff4444',
    color: '#fff',
    padding: '12px',
    borderRadius: '6px',
    marginBottom: '20px',
    fontSize: '14px',
    textAlign: 'center'
  },
  successMessage: {
    backgroundColor: '#4CAF50',
    color: '#fff',
    padding: '12px',
    borderRadius: '6px',
    marginBottom: '20px',
    fontSize: '14px',
    textAlign: 'center'
  }
};

export default AuthForm;
