import React, { useState } from 'react';
import GameCanvas from './components/GameCanvas';
import Dashboard from './pages/Dashboard.jsx';

function App() {
  const [view, setView] = useState('game');
  return (
    <div className="App" style={{ padding: 12 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button onClick={() => setView('game')}>Game</button>
        <button onClick={() => setView('dashboard')}>Dashboard</button>
      </div>
      {view === 'game' ? <GameCanvas /> : <Dashboard />}
    </div>
  );
}

export default App;
