import React from 'react';

const DURATIONS = [10, 15, 20, 30, 45, 60];

export default function SideNav({ limitSec, setLimitSec, onNewText, onReset }) {
  return (
    <aside className="sidebar card">

      <div className="side-group">
        <button className="btn" onClick={onNewText}>Nouveau texte</button>
        <button className="btn" onClick={onReset}>Réinitialiser</button>
      </div>

      <div className="side-group">
        <div className="side-pills">
          {DURATIONS.map(d => (
            <button
              key={d}
              className={`pill ${limitSec === d ? 'active' : ''}`}
              onClick={() => setLimitSec(d)}
              type="button"
            >
              {d}s
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
