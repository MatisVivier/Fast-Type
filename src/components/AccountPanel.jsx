import React, { useEffect, useMemo, useState } from 'react';
import { apiGet, apiPost } from '../lib/api.js';

export default function AccountPanel({ user, onUserUpdate }) {
  const [matches, setMatches] = useState([]);
  const [rankedStats, setRankedStats] = useState(null);
  const [soloStats, setSoloStats] = useState(null);

  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState(user?.username || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const m = await apiGet('/account/matches?limit=5');
        setMatches(Array.isArray(m?.matches) ? m.matches : []);
      } catch { setMatches([]); }

      try {
        const rs = await apiGet('/account/ranked-stats');
        setRankedStats(rs || null);
      } catch { setRankedStats(null); }

      try {
        const ss = await apiGet('/account/solo-stats');
        setSoloStats(ss || null);
      } catch { setSoloStats(null); }
    })();
  }, [user]);

  useEffect(() => { setNewName(user?.username || ''); }, [user]);

  const last5 = useMemo(() => {
    if (!user) return { wr5: 0, bestWpm5: 0 };
    const me = user.id;
    let wins = 0, total = matches.length, best = 0;
    for (const m of matches) {
      if (m.winner_id === me) wins++;
      const myWpm = (m.p1_id === me) ? (m.p1_wpm || 0) : (m.p2_wpm || 0);
      if (myWpm > best) best = myWpm;
    }
    const wr5 = total ? Math.round((wins / total) * 100) : 0;
    return { wr5, bestWpm5: best };
  }, [matches, user]);

  const saveUsername = async () => {
    setSaving(true);
    const res = await apiPost('/account/username', { username: newName });
    setSaving(false);
    if (res?.error) { alert('Erreur: ' + res.error); return; }
    setEditing(false);
    onUserUpdate?.();
  };

  if (!user) return null;

  const fmtAcc = (a) => a != null ? `${Math.round(a*100)}%` : '—';
  const fmtDateShort = (d) => new Date(d).toLocaleString();

  return (
    <section className="account-wide card">
      <style>{`
        .accountGrid { display:grid; grid-template-columns: 1fr 1fr; gap:16px; }
        @media (max-width: 900px){ .accountGrid { grid-template-columns: 1fr; } }

        .grid4 { display:grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap:8px; }
        .grid2 { display:grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap:8px; }
        .tile { background:#0f1116; border:0; padding:10px 12px; border-radius:10px; }
        .k { font-size:12px; color:#9aa4af; }
        .v { font-weight:700; font-size:16px; }
        .mini { font-size:12px; color:#9aa4af; }
        .muted { color:#9aa4af; }
        .chip { font-size:12px; padding:2px 8px; border-radius:999px; background:#1b1f27; display:inline-block; }
        .resultWin { color:#a3ffba; }
        .resultLoss { color:#ff8f8f; }
        .resultDraw { color:#9aa4af; }

        /* Cartes matchs en grille 1x5 (responsive) */
        .matchGrid {
          width:100%;
          display:grid;
          grid-template-columns: repeat(5, minmax(0,1fr));
          gap:12px;
          margin-top:12px;
        }
        @media (max-width: 1200px){ .matchGrid { grid-template-columns: repeat(3, minmax(0,1fr)); } }
        @media (max-width: 800px){ .matchGrid { grid-template-columns: repeat(2, minmax(0,1fr)); } }
        @media (max-width: 520px){ .matchGrid { grid-template-columns: 1fr; } }

        .matchCard { background:#0f1116; border:0; padding:12px; border-radius:10px; display:flex; flex-direction:column; gap:6px; }
        .matchHead { display:flex; align-items:center; justify-content:space-between; gap:8px; }
        .opponent { font-weight:600; }
        .rowMini { display:flex; gap:8px; flex-wrap:wrap; align-items:center; }
      `}</style>

      {/* Header + édition pseudo */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, flexWrap:'wrap' }}>
        <div><div className="muted">Historique et statistiques</div></div>
        <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
          {!editing ? (
            <>
              <span className="stat">👤 {user.username}</span>
              <button className="btn" onClick={()=>setEditing(true)}>Modifier le pseudo</button>
            </>
          ) : (
            <>
              <input className="input mono" value={newName} onChange={e=>setNewName(e.target.value)} minLength={3} maxLength={20} />
              <button className="btn" onClick={saveUsername} disabled={saving}>{saving ? '...' : 'Enregistrer'}</button>
              <button className="btn secondary" onClick={()=>{ setEditing(false); setNewName(user.username); }}>Annuler</button>
            </>
          )}
        </div>
      </div>

      {/* Deux colonnes: Classé (gauche), Solo (droite) */}
      <div className="accountGrid" style={{ marginTop: 12 }}>
        {/* ==== CLASSÉ ==== */}
        <div>
          <h4 style={{ marginTop:0 }}>Classé</h4>
          <div className="grid4">
            <div className="tile"><div className="k">Matchs</div><div className="v">{rankedStats?.total ?? 0}</div></div>
            <div className="tile"><div className="k">WR</div><div className="v">{rankedStats ? Math.round((rankedStats.wins / Math.max(1, rankedStats.total)) * 100) : 0}%</div></div>
            <div className="tile"><div className="k">WPM (moy.)</div><div className="v">{rankedStats?.avgWpm ?? 0}</div></div>
            <div className="tile"><div className="k">Précision (moy.)</div><div className="v">{fmtAcc(rankedStats?.avgAcc)}</div></div>
          </div>
          <div className="grid2" style={{ marginTop: 8 }}>
            <div className="tile"><div className="k">WR (5 derniers)</div><div className="v">{last5.wr5}%</div></div>
            <div className="tile"><div className="k">Best WPM (5)</div><div className="v">{last5.bestWpm5}</div></div>
          </div>
        </div>

        {/* ==== SOLO ==== */}
        <div>
          <h4 style={{ marginTop:0 }}>Solo</h4>
          <div className="grid4">
            <div className="tile"><div className="k">Runs</div><div className="v">{soloStats?.runs ?? 0}</div></div>
            <div className="tile"><div className="k">WPM (moy.)</div><div className="v">{soloStats?.avgWpm ?? 0}</div></div>
            <div className="tile"><div className="k">Précision (moy.)</div><div className="v">{fmtAcc(soloStats?.avgAcc)}</div></div>
            <div className="tile"><div className="k">Mots tapés</div><div className="v">{soloStats?.wordsTyped ?? 0}</div></div>
          </div>
          {soloStats?.totalMs > 0 && (
            <div className="grid2" style={{ marginTop: 8 }}>
              <div className="tile"><div className="k">Temps total</div><div className="v">{Math.round(soloStats.totalMs / 1000)}s</div></div>
              <div className="tile"><div className="k">—</div><div className="v">—</div></div>
            </div>
          )}
        </div>
      </div>

      {/* ===== 5 derniers matchs en GRILLE 1x5 ===== */}
      <h5 style={{ margin:'16px 0 8px 0' }}>5 derniers matchs</h5>
      {matches.length === 0 ? (
        <div className="mini">Pas encore de matchs.</div>
      ) : (
        <div className="matchGrid">
          {matches.map(m => {
            const me = user.id;
            const iAmP1 = m.p1_id === me;
            const oppName = iAmP1 ? (m.p2_username || 'Adversaire') : (m.p1_username || 'Adversaire');
            const myWpm = iAmP1 ? m.p1_wpm : m.p2_wpm;
            const opWpm = iAmP1 ? m.p2_wpm : m.p1_wpm;
            const myAcc = iAmP1 ? m.p1_acc : m.p2_acc;
            const myBefore = iAmP1 ? m.p1_rating_before : m.p2_rating_before;
            const myAfter  = iAmP1 ? m.p1_rating_after  : m.p2_rating_after;
            const deltaElo = (myAfter ?? 0) - (myBefore ?? 0);
            const result =
              m.winner_id == null ? 'Égalité'
              : m.winner_id === me ? 'Victoire'
              : 'Défaite';
            const resultCls =
              m.winner_id == null ? 'resultDraw' :
              (m.winner_id === me ? 'resultWin' : 'resultLoss');
            const reason = m.reason || '';
            const dur = Math.round((m.elapsed_ms || 0) / 1000);

            return (
              <div key={m.id} className="matchCard">
                <div className="matchHead">
                  <span className="mini">{fmtDateShort(m.created_at)}</span>
                  <span className={`chip ${resultCls}`}>{result}</span>
                </div>
                <div className="opponent">{oppName}</div>
                <div className="rowMini">
                  <span className="mini">WPM <b>{myWpm ?? 0}</b> ({opWpm ?? 0})</span>
                  <span className="mini">Préc. <b>{fmtAcc(myAcc)}</b></span>
                </div>
                <div className="rowMini">
                  <span className="mini">
                    Elo <b style={{ color: deltaElo >= 0 ? '#a3ffba' : '#ff8f8f' }}>
                      {deltaElo >= 0 ? '+' : ''}{deltaElo}
                    </b>
                  </span>
                  <span className="mini">{dur}s</span>
                </div>
                {reason && <div className="mini" style={{ opacity:.8 }}>— {reason}</div>}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
