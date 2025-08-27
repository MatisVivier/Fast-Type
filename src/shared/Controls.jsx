import React from 'react';

const TIME_OPTS = [10, 15, 20, 30, 45, 60];
export default function Controls({ mode, limitSec, setLimitSec, onNewText, onReset }) {
return (
<div className="row text" style={{marginBottom:12}}>
<div className="row">
<button className="btn" onClick={onNewText}>Nouveau texte</button>
<button className="btn secondary" onClick={onReset}>Réinitialiser</button>
</div>
<div className="row">
        <div className="row">
          {TIME_OPTS.map(t => (
            <button
              key={t}
              className="btn"
              style={t === limitSec ? { borderColor: '#e2b714' } : null}
              onClick={() => setLimitSec(t)}
            >
              {t}s
            </button>
          ))}
        </div>
{mode === 'time' && (
<select value={limitSec} onChange={e => setLimitSec(parseInt(e.target.value))}>
<option value={15}>15s</option>
<option value={30}>30s</option>
<option value={60}>60s</option>
<option value={120}>120s</option>
</select>
)}
</div>
</div>
);
}