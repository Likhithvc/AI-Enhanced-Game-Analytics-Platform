import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const getLeaderboard = async (top = 10) => {
  const res = await axios.get(`${API_BASE}/api/v1/leaderboard`, { params: { top } });
  return res.data;
};

export const getSummary = async ({ user_id, from, to } = {}) => {
  const res = await axios.get(`${API_BASE}/api/v1/analytics/summary`, {
    params: { user_id, from, to }
  });
  return res.data;
};

export const getHeatmap = async ({ level, date }) => {
  const res = await axios.get(`${API_BASE}/api/v1/heatmap`, { params: { level, date } });
  return res.data;
};
