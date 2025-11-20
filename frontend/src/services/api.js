import axios from 'axios';
import { getAuthHeaders } from './auth';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const getLeaderboard = async (top = 10) => {
  const res = await axios.get(`${API_BASE}/api/v1/leaderboard`, { params: { top } });
  return res.data;
};

export const getSummary = async ({ user_id, from, to } = {}) => {
  const res = await axios.get(`${API_BASE}/api/v1/analytics/summary`, {
    params: { user_id, from, to },
    headers: getAuthHeaders()
  });
  return res.data;
};

export const getHeatmap = async ({ level, date }) => {
  const res = await axios.get(`${API_BASE}/api/v1/heatmap`, { 
    params: { level, date },
    headers: getAuthHeaders()
  });
  return res.data;
};

/**
 * Submit a game score
 * Requires authentication
 */
export const submitScore = async (score) => {
  const res = await axios.post(
    `${API_BASE}/api/v1/scores/submit`,
    { score },
    { headers: getAuthHeaders() }
  );
  return res.data;
};
