import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getLeaderboard, getSummary, getHeatmap } from '../services/api';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

export default function Dashboard() {
  const [summary, setSummary] = useState({ data: [] });
  const [leaderboard, setLeaderboard] = useState([]);
  const [level, setLevel] = useState('1');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [heatmap, setHeatmap] = useState(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const [sumRes, lbRes] = await Promise.all([
          getSummary({}),
          getLeaderboard(10),
        ]);
        setSummary(sumRes);
        setLeaderboard(lbRes);
      } catch (e) {
        console.error('Failed to load initial data', e);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const hm = await getHeatmap({ level, date });
        setHeatmap(hm);
      } catch (e) {
        setHeatmap(null);
      }
    })();
  }, [level, date]);

  useEffect(() => {
    if (!heatmap || !heatmap.matrix) return;
    const matrix = heatmap.matrix;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const size = 400;
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
        const r = Math.floor(255 * t);
        const g = Math.floor(64 * (1 - t));
        const b = 0;
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x * cellW, y * cellH, Math.ceil(cellW), Math.ceil(cellH));
      }
    }
  }, [heatmap]);

  const chartData = useMemo(() => {
    const labels = summary.data.map(d => d.day);
    const avgScores = summary.data.map(d => d.avg_score ?? 0);
    return {
      labels,
      datasets: [
        {
          label: 'Avg Score',
          data: avgScores,
          fill: false,
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1,
        },
      ],
    };
  }, [summary]);

  return (
    <div style={{ padding: 16 }}>
      <h2>Analytics Dashboard</h2>

      <section style={{ marginBottom: 24 }}>
        <h3>Average Score Over Time</h3>
        <Line data={chartData} />
      </section>

      <section style={{ marginBottom: 24 }}>
        <h3>Leaderboard (Top 10)</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>Rank</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>User</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>Best Score</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>Avg Score</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>Games Played</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((row, idx) => (
              <tr key={row.user_id}>
                <td>{idx + 1}</td>
                <td>{row.username || row.user_id}</td>
                <td>{row.best_score}</td>
                <td>{row.avg_score?.toFixed?.(2) ?? '-'}</td>
                <td>{row.games_played}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h3>Heatmap</h3>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
          <label>Level:&nbsp;<input value={level} onChange={e => setLevel(e.target.value)} style={{ width: 100 }} /></label>
          <label>Date:&nbsp;<input type="date" value={date} onChange={e => setDate(e.target.value)} /></label>
        </div>
        {heatmap?.matrix ? (
          <canvas ref={canvasRef} style={{ border: '1px solid #ddd' }} />
        ) : (
          <div style={{ color: '#666' }}>No heatmap available.</div>
        )}
      </section>
    </div>
  );
}
