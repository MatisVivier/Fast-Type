import React, { useEffect, useMemo, useRef, useState } from 'react';
import TypeBox from '../shared/MTTypeBox.jsx';
import { apiGet } from '../lib/api.js';
import "../duel.css"
import { socket } from '../lib/socket.js';

export default function Duel({ onExit, onUserRefresh }) {
  const [status, setStatus] = useState('idle');  // idle | queue | ready | playing | done | error
  const [roomId, setRoomId] = useState(null);
  const [startAt, setStartAt] = useState(null);
  const [text, setText] = useState(null);
  const [players, setPlayers] = useState([]);
  const [opponent, setOpponent] = useState({ pos: 0, errors: 0 });
  const [result, setResult] = useState(null);
  const [connError, setConnError] = useState(null);
  const [me, setMe] = useState(null);

  const [limitSec, setLimitSec] = useState(20); // classé = 20s

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    apiGet('/auth/me').then(res => setMe(res.user || null));
    const id = setInterval(() => setNow(Date.now()), 100); // tick plus fin pour le countdown
    return () => clearInterval(id);
  }, []);

  // ------- socket wiring
  useEffect(() => {
    const onConnect = () => { setConnError(null); };
    const onConnectError = (err) => { setConnError(err.message || 'connect_error'); };

    socket.on('connect', onConnect);
    socket.on('connect_error', onConnectError);
    socket.on('queue:error', () => setStatus('error'));

    socket.on('matchFound', ({ roomId, startAt, text, players, limitSec }) => {
      setRoomId(roomId);
      setStartAt(startAt);             // timestamp (ms) à venir
      setText(text);
      setPlayers(players || []);
      setLimitSec(limitSec || 20);
      setStatus('ready');              // on affiche le compte à rebours
    });

    socket.on('opponent:progress', (p) => setOpponent(prev => ({ ...prev, ...p })));
    socket.on('match:result', async (payload) => {
      setResult(payload);
      setStatus('done');
      if (onUserRefresh) await onUserRefresh();
      const meRef = await apiGet('/auth/me');
      setMe(meRef.user || null);
    });

    return () => {
      socket.off('connect', onConnect);
      socket.off('connect_error', onConnectError);
      socket.off('queue:error');
      socket.off('matchFound');
      socket.off('opponent:progress');
      socket.off('match:result');
    };
  }, [onUserRefresh]);

  // ------- queue helpers
  const queuedRef = useRef(false);
  const joinQueue = () => {
    if (queuedRef.current) return;
    queuedRef.current = true;
    setStatus('queue');
    socket.emit('queue:join');
  };

  const leaveQueue = () => {
    if (status === 'queue') socket.emit('queue:leave');
    queuedRef.current = false;
  };

  // auto-queue à l’arrivée
  useEffect(() => {
    joinQueue();
    return () => leaveQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ------- timing & progression
  const rawCountdown = useMemo(() => {
    if (!startAt) return null;
    const msLeft = Math.max(0, startAt - now);
    return Math.ceil(msLeft / 1000); // 5,4,3,2,1,0
  }, [startAt, now]);

  // passe en "playing" exactement à 0
  useEffect(() => {
    if (status === 'ready' && startAt) {
      const msLeft = startAt - now;
      if (msLeft <= 0) setStatus('playing');
    }
  }, [status, startAt, now]);

  const lastEmitRef = useRef(0);
  const onProgress = (pos, errors, elapsed) => {
    const t = performance.now();
    if (t - lastEmitRef.current >= 100) {
      lastEmitRef.current = t;
      socket.emit('match:progress', { roomId, pos, errors, t: elapsed });
    }
  };
  const onFinish = (stats) => socket.emit('match:finish', { roomId, stats });

  const pct = (x) => `${(x * 100).toFixed(1)}%`;
  const sec = (ms) => `${(ms / 1000).toFixed(2)}s`;

  return (
    <div className="container">
      <style>{`
        .countdown-overlay {
          position: fixed; inset: 0;
          display: flex; align-items: center; justify-content: center;
          background: rgba(0,0,0,0.55);
          z-index: 50;
        }
        .countdown-box {
          background: #10131a;
          border: 1px solid #1f2733;
          border-radius: 14px;
          padding: 24px 28px;
          text-align: center;
          box-shadow: 0 10px 35px rgba(0,0,0,0.35);
          min-width: 320px;
        }
        .count-title { font-size: 18px; opacity: .9; margin-bottom: 6px; }
        .count-vs { font-weight: 600; margin-bottom: 14px; }
        .count-num {
          font-size: 64px; line-height: 1; font-weight: 800;
          letter-spacing: 2px;
          animation: pop .9s ease-in-out infinite;
          color: #e2b714;
          text-shadow: 0 0 18px rgba(226,183,20,.35);
        }
        @keyframes pop { 0%{transform: scale(1)} 50%{transform: scale(1.12)} 100%{transform: scale(1)} }
        .muted { opacity: .7; font-size: 13px; }
        .chip { padding: 4px 8px; border-radius: 999px; background: #19202b; border: 1px solid #253045; font-size: 12px; }
        .chip-gold { background: rgba(226,183,20,.12); border-color: rgba(226,183,20,.35); color: #e2b714; }
        .results-card .trophy { margin-right: 8px; }
      `}</style>

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop: "40px", marginBottom: "30px" }}>
        <h1>Classé</h1>
        <div className="row">
          {me && <span className="stat">Ton Elo: <strong>{me.rating}</strong></span>}
          <button
            className="btn secondary"
            onClick={() => { leaveQueue(); onExit?.(); }}
          >
            ← Retour
          </button>
        </div>
      </div>

      {connError && (
        <div className="card" style={{ marginTop: 12 }}>
          <p style={{ color: '#ff6b6b' }}>Erreur de connexion Socket.IO : {connError}</p>
        </div>
      )}

      {status === 'queue' && (
        <div className="card" style={{ marginTop: 12, textAlign: "center" }}>
          <p>Salle d’attente… on te cherche un adversaire (±100 Elo).</p>
          <div className="row" style={{ gap: 8 }}>
            <button className="btn secondary" onClick={leaveQueue}>Annuler</button>
          </div>
        </div>
      )}

      {status === 'ready' && (
        <>
          <div className="card" style={{textAlign: "center"}}>
            <p>
              Match trouvé ! Départ imminent…<br/>
              {players.length === 2 && (
                <span className="muted">
                  {players[0].username} ({players[0].rating}) vs {players[1].username} ({players[1].rating}) — durée: <strong>{limitSec}s</strong>
                </span>
              )}
            </p>
          </div>

          {/* Overlay de compte à rebours */}
          <div className="countdown-overlay">
            <div className="countdown-box">
              <div className="count-title">Adversaire trouvé</div>
              <div className="count-vs">
                {players.length === 2 ? (
                  <>
                    <strong>{players[0].username}</strong> vs <strong>{players[1].username}</strong>
                  </>
                ) : (
                  <>Préparation du duel…</>
                )}
              </div>
              <div className="count-num">
                {Math.max(0, rawCountdown ?? 0)}
              </div>
              <div className="muted" style={{ marginTop: 10 }}>La manche démarre automatiquement</div>
              <div style={{ marginTop: 10, display:'flex', gap:8, justifyContent:'center' }}>
                <span className="chip chip-gold">Durée {limitSec}s</span>
                <span className="chip">Fair-play & focus ✨</span>
              </div>
            </div>
          </div>
        </>
      )}

      {status === 'playing' && text && (
        <div className="card">
          <TypeBox
            content={text.content}
            mode="time"
            limitSec={limitSec}
            onProgress={onProgress}
            onFinish={onFinish}
          />
          <div style={{ marginTop: 12, textAlign: "center" }}>
            {players.length === 2 && me && (
              <>
                Adversaire — <strong>{players.find(p => p.id !== me.id)?.username || 'Adversaire'}</strong>
                {' '}• progression : {opponent.pos ?? 0} • erreurs : {opponent.errors ?? 0}
              </>
            )}
          </div>
        </div>
      )}

      {status === 'done' && result && (
        <div className="card results-card">
          <div className="results-header">
            {result.winnerUsername ? (
              <div className="winner-line">
                <span className="trophy">Gagnant :</span>
                <span className="winner-name">{result.winnerUsername}</span>
                <span className="reason">({result.reason})</span>
              </div>
            ) : (
              <div className="winner-line">
                <span className="trophy">🤝</span>
                <span className="winner-name">Égalité</span>
                <span className="reason">({result.reason})</span>
              </div>
            )}

            <div className="chips">
              <span className="chip">Temps total {sec(result.totalElapsed)}</span>
              <span className="chip chip-gold">Durée manche {limitSec}s</span>
            </div>
          </div>

          <div className="versus">
            {/* P1 */}
            <div className={`player-card ${result.winnerUsername === result.p1.username ? 'is-winner' : ''}`}>
              <div className="player-head">
                <div className="avatar-circle">{result.p1.username.slice(0,1).toUpperCase()}</div>
                <div className="player-meta">
                  <div className="player-name">{result.p1.username}</div>
                  <div className="player-elo">
                    Elo&nbsp;:&nbsp;{result.p1.ratingBefore}
                    <span className={`elo-delta ${result.p1.ratingAfter - result.p1.ratingBefore >= 0 ? 'up' : 'down'}`}>
                      {result.p1.ratingAfter - result.p1.ratingBefore >= 0 ? ' +' : ' '}{result.p1.ratingAfter - result.p1.ratingBefore}
                    </span>
                    &nbsp;→ <strong>{result.p1.ratingAfter}</strong>
                  </div>
                </div>
              </div>
              <div className="stat-lines">
                <div className="stat-line">
                  <span>MPM</span>
                  <strong>{result.p1.wpm}</strong>
                  <div className="bar"><div
                    className="bar-fill"
                    style={{ width: `${(result.p1.wpm / Math.max(result.p1.wpm, result.p2.wpm || 1)) * 100}%` }}
                  /></div>
                </div>
                <div className="stat-line">
                  <span>Précision</span>
                  <strong>{pct(result.p1.acc)}</strong>
                  <div className="bar"><div
                    className="bar-fill"
                    style={{ width: `${(result.p1.acc || 0) * 100}%` }}
                  /></div>
                </div>
                <div className="stat-line">
                  <span>Temps</span>
                  <strong>{sec(result.p1.elapsed)}</strong>
                </div>
              </div>
            </div>

            <div className="vs-badge">VS</div>

            {/* P2 */}
            <div className={`player-card ${result.winnerUsername === result.p2.username ? 'is-winner' : ''}`}>
              <div className="player-head">
                <div className="avatar-circle">{result.p2.username.slice(0,1).toUpperCase()}</div>
                <div className="player-meta">
                  <div className="player-name">{result.p2.username}</div>
                  <div className="player-elo">
                    Elo&nbsp;:&nbsp;{result.p2.ratingBefore}
                    <span className={`elo-delta ${result.p2.ratingAfter - result.p2.ratingBefore >= 0 ? 'up' : 'down'}`}>
                      {result.p2.ratingAfter - result.p2.ratingBefore >= 0 ? ' +' : ' '}{result.p2.ratingAfter - result.p2.ratingBefore}
                    </span>
                    &nbsp;→ <strong>{result.p2.ratingAfter}</strong>
                  </div>
                </div>
              </div>
              <div className="stat-lines">
                <div className="stat-line">
                  <span>MPM</span>
                  <strong>{result.p2.wpm}</strong>
                  <div className="bar"><div
                    className="bar-fill"
                    style={{ width: `${(result.p2.wpm / Math.max(result.p1.wpm, result.p2.wpm || 1)) * 100}%` }}
                  /></div>
                </div>
                <div className="stat-line">
                  <span>Précision</span>
                  <strong>{pct(result.p2.acc)}</strong>
                  <div className="bar"><div
                    className="bar-fill"
                    style={{ width: `${(result.p2.acc || 0) * 100}%` }}
                  /></div>
                </div>
                <div className="stat-line">
                  <span>Temps</span>
                  <strong>{sec(result.p2.elapsed)}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="card">
          <p>Tu dois être connecté pour jouer en classé. Connecte-toi puis réessaie.</p>
        </div>
      )}
    </div>
  );
}
