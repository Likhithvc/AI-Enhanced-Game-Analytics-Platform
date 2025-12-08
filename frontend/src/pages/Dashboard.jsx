import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getLeaderboard, getSummary, getHeatmap } from '../services/api';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  Title,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  Title
);

export default function Dashboard({ currentUser }) {
  const [summary, setSummary] = useState({ data: [] });
  const [leaderboard, setLeaderboard] = useState([]);
  const [level, setLevel] = useState('1');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [heatmap, setHeatmap] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);
  const [loadingHeatmap, setLoadingHeatmap] = useState(true);
  const [errorSummary, setErrorSummary] = useState('');
  const [errorLeaderboard, setErrorLeaderboard] = useState('');
  const [errorHeatmap, setErrorHeatmap] = useState('');
  const canvasRef = useRef(null);

  // Load summary and leaderboard on mount
  useEffect(() => {
    const loadInitialData = async () => {
      setLoadingSummary(true);
      setLoadingLeaderboard(true);
      setErrorSummary('');
      setErrorLeaderboard('');

      try {
        const sumRes = await getSummary({ user_id: currentUser?.id });
        setSummary(sumRes || { data: [] });
        setLoadingSummary(false);
      } catch (e) {
        console.error('Failed to load summary', e);
        setErrorSummary('Failed to load analytics summary');
        setLoadingSummary(false);
      }

      try {
        const lbRes = await getLeaderboard(10);
        setLeaderboard(Array.isArray(lbRes) ? lbRes : []);
        setLoadingLeaderboard(false);
      } catch (e) {
        console.error('Failed to load leaderboard', e);
        setErrorLeaderboard('Failed to load leaderboard');
        setLoadingLeaderboard(false);
      }
    };

    loadInitialData();
  }, []);

  // Load heatmap when level or date changes
  useEffect(() => {
    const loadHeatmap = async () => {
      setLoadingHeatmap(true);
      setErrorHeatmap('');

      try {
        const hm = await getHeatmap({ level, date });
        if (hm && hm.matrix && hm.matrix.length > 0) {
          setHeatmap(hm);
          setErrorHeatmap('');
        } else {
          setHeatmap(null);
          setErrorHeatmap('No heatmap data available for this level and date');
        }
        setLoadingHeatmap(false);
      } catch (e) {
        console.error('Failed to load heatmap', e);
        setHeatmap(null);
        setErrorHeatmap('Failed to load heatmap data');
        setLoadingHeatmap(false);
      }
    };

    loadHeatmap();
  }, [level, date]);

  // Draw heatmap on canvas
  useEffect(() => {
    if (!heatmap || !heatmap.matrix) return;
    const matrix = heatmap.matrix;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const size = 500;
    const rows = matrix.length;
    const cols = matrix[0]?.length || 0;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, size, size);

    const maxVal = matrix.flat().reduce((m, v) => Math.max(m, v), 0) || 1;
    const cellW = size / cols;
    const cellH = size / rows;

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const v = matrix[y][x];
        const t = v / maxVal;
        // Better color gradient: cool to hot
        const r = Math.floor(255 * t);
        const g = Math.floor(200 * (1 - Math.abs(t - 0.5) * 2));
        const b = Math.floor(255 * (1 - t));
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x * cellW, y * cellH, Math.ceil(cellW), Math.ceil(cellH));
      }
    }
  }, [heatmap]);

  const chartData = useMemo(() => {
    const labels = summary.data?.map(d => d.day) || [];
    const avgScores = summary.data?.map(d => d.avg_score ?? 0) || [];

    return {
      labels,
      datasets: [
        {
          label: 'Average Score',
          data: avgScores,
          borderColor: '#FFD700',
          backgroundColor: 'rgba(255, 215, 0, 0.1)',
          borderWidth: 3,
          tension: 0.4,
          fill: true,
          pointRadius: 6,
          pointHoverRadius: 8,
          pointBackgroundColor: '#FFD700',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
        },
      ],
    };
  }, [summary]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        labels: {
          color: '#eee',
          font: { size: 14, weight: 'bold' },
        },
      },
      title: {
        color: '#FFD700',
        font: { size: 16, weight: 'bold' },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#FFD700',
        bodyColor: '#eee',
        borderColor: '#FFD700',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        ticks: { color: '#aaa' },
        grid: { color: 'rgba(255, 215, 0, 0.1)' },
      },
      y: {
        ticks: { color: '#aaa' },
        grid: { color: 'rgba(255, 215, 0, 0.1)' },
      },
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.pageTitle}>📊 Analytics Dashboard</h1>
        <p style={styles.subtitle}>Real-time game analytics and player insights</p>
      </div>

      {/* Summary Chart Section */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>📈 Average Score Over Time</h2>
        {loadingSummary ? (
          <div style={styles.loadingState}>Loading chart data...</div>
        ) : errorSummary ? (
          <div style={styles.errorBox}>{errorSummary}</div>
        ) : summary.data && summary.data.length > 0 ? (
          <div style={styles.chartContainer}>
            <Line data={chartData} options={chartOptions} />
          </div>
        ) : (
          <div style={styles.emptyState}>No analytics data available yet. Play some games to see results!</div>
        )}
      </section>

      {/* Leaderboard Section */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>🏆 Top 10 Players</h2>
        {loadingLeaderboard ? (
          <div style={styles.loadingState}>Loading leaderboard...</div>
        ) : errorLeaderboard ? (
          <div style={styles.errorBox}>{errorLeaderboard}</div>
        ) : leaderboard && leaderboard.length > 0 ? (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.headerRow}>
                  <th style={{...styles.th, width: '10%'}}>Rank</th>
                  <th style={{...styles.th, textAlign: 'left', width: '30%'}}>Username</th>
                  <th style={{...styles.th, width: '20%'}}>Best Score</th>
                  <th style={{...styles.th, width: '20%'}}>Avg Score</th>
                  <th style={{...styles.th, width: '20%'}}>Games</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((row, idx) => (
                  <tr key={row.user_id || idx} style={{...styles.row, ...(idx % 2 === 0 ? styles.rowEven : {})}}>
                    <td style={styles.td}>
                      <span style={styles.rankBadge}>
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`}
                      </span>
                    </td>
                    <td style={{...styles.td, textAlign: 'left', fontWeight: 500}}>{row.username || row.user_id}</td>
                    <td style={styles.td}>
                      <span style={styles.scoreHighlight}>{row.best_score || 0}</span>
                    </td>
                    <td style={styles.td}>{row.avg_score ? row.avg_score.toFixed(2) : '-'}</td>
                    <td style={styles.td}>{row.games_played || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={styles.emptyState}>No leaderboard data available yet. Start playing to appear on the leaderboard!</div>
        )}
      </section>

      {/* Heatmap Section */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>🔥 Player Position Heatmap</h2>
        <div style={styles.heatmapControls}>
          <div style={styles.controlGroup}>
            <label style={styles.label}>Level:</label>
            <input
              type="text"
              value={level}
              onChange={e => setLevel(e.target.value)}
              placeholder="e.g., 1, 2, 3"
              style={styles.input}
            />
          </div>
          <div style={styles.controlGroup}>
            <label style={styles.label}>Date:</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              style={styles.input}
            />
          </div>
        </div>

        {loadingHeatmap ? (
          <div style={styles.loadingState}>Loading heatmap...</div>
        ) : errorHeatmap ? (
          <div style={styles.errorBox}>{errorHeatmap}</div>
        ) : heatmap && heatmap.matrix ? (
          <div style={styles.heatmapContainer}>
            <canvas
              ref={canvasRef}
              style={styles.heatmapCanvas}
            />
            <div style={styles.heatmapLegend}>
              <p style={styles.legendText}>🔵 Cool (Low Activity) → 🔴 Hot (High Activity)</p>
            </div>
          </div>
        ) : (
          <div style={styles.emptyState}>No heatmap data available. Try different level or date.</div>
        )}
      </section>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#1a1a2e',
    color: '#eee',
    padding: '40px 20px',
    fontFamily: 'Arial, sans-serif',
  },
  header: {
    textAlign: 'center',
    marginBottom: '50px',
  },
  pageTitle: {
    color: '#FFD700',
    fontSize: '42px',
    margin: '0 0 10px 0',
    fontWeight: '700',
  },
  subtitle: {
    color: '#aaa',
    fontSize: '18px',
    margin: 0,
  },
  section: {
    backgroundColor: '#16213e',
    borderRadius: '12px',
    padding: '30px',
    marginBottom: '40px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    border: '1px solid #0f3460',
  },
  sectionTitle: {
    color: '#FFD700',
    fontSize: '24px',
    marginTop: 0,
    marginBottom: '25px',
    fontWeight: '700',
    borderBottom: '2px solid #0f3460',
    paddingBottom: '15px',
  },
  chartContainer: {
    backgroundColor: 'rgba(15, 52, 96, 0.5)',
    borderRadius: '8px',
    padding: '20px',
    border: '1px solid rgba(255, 215, 0, 0.1)',
  },
  tableWrapper: {
    overflowX: 'auto',
    borderRadius: '8px',
    border: '1px solid rgba(255, 215, 0, 0.1)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    backgroundColor: 'rgba(15, 52, 96, 0.5)',
  },
  headerRow: {
    backgroundColor: '#0f3460',
    borderBottom: '3px solid #FFD700',
  },
  th: {
    padding: '16px',
    color: '#FFD700',
    fontSize: '14px',
    fontWeight: '700',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  row: {
    borderBottom: '1px solid rgba(255, 215, 0, 0.1)',
    transition: 'background-color 0.2s ease',
  },
  rowEven: {
    backgroundColor: 'rgba(255, 215, 0, 0.03)',
  },
  td: {
    padding: '14px 16px',
    color: '#eee',
    fontSize: '15px',
    textAlign: 'center',
  },
  rankBadge: {
    fontSize: '18px',
    fontWeight: '700',
  },
  scoreHighlight: {
    color: '#FFD700',
    fontWeight: '700',
    fontSize: '16px',
  },
  heatmapControls: {
    display: 'flex',
    gap: '20px',
    marginBottom: '25px',
    flexWrap: 'wrap',
  },
  controlGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  label: {
    color: '#FFD700',
    fontSize: '15px',
    fontWeight: '600',
    minWidth: '60px',
  },
  input: {
    padding: '10px 15px',
    backgroundColor: '#0f3460',
    color: '#fff',
    border: '2px solid #1a1a2e',
    borderRadius: '6px',
    fontSize: '15px',
    transition: 'all 0.3s ease',
    outline: 'none',
  },
  heatmapContainer: {
    backgroundColor: 'rgba(15, 52, 96, 0.5)',
    borderRadius: '8px',
    padding: '20px',
    border: '1px solid rgba(255, 215, 0, 0.1)',
    textAlign: 'center',
  },
  heatmapCanvas: {
    border: '2px solid #FFD700',
    borderRadius: '8px',
    maxWidth: '100%',
    height: 'auto',
    display: 'block',
    margin: '0 auto 20px',
  },
  heatmapLegend: {
    backgroundColor: '#0f3460',
    padding: '15px',
    borderRadius: '6px',
  },
  legendText: {
    color: '#aaa',
    fontSize: '14px',
    margin: 0,
  },
  loadingState: {
    padding: '40px',
    textAlign: 'center',
    color: '#aaa',
    fontSize: '16px',
  },
  errorBox: {
    padding: '20px',
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    borderLeft: '4px solid #ff4444',
    borderRadius: '6px',
    color: '#ff9999',
    fontSize: '15px',
  },
  emptyState: {
    padding: '40px',
    textAlign: 'center',
    color: '#aaa',
    fontSize: '16px',
    fontStyle: 'italic',
  },
};
