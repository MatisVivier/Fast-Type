import React, { useEffect, useMemo, useRef, useState } from 'react';
import io from 'socket.io-client';
import TypeBox from '../shared/MTTypeBox.jsx';   // ou MTTypeBox
import { apiGet } from '../lib/api.js';
import "../duel.css"

const socket = io('http://localhost:3001', {
  transports: ['websocket'],
  withCredentials: true,
});

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
    const id = setInterval(() => setNow(Date.now()), 200);
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
      setStartAt(startAt);
      setText(text);
      setPlayers(players || []);
      setLimitSec(limitSec || 20);
      setStatus('ready');
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
    socket.emit('queue:join'); // pas de durée envoyée
  };

  const leaveQueue = () => {
    if (status === 'queue') {
      socket.emit('queue:leave');
    }
    queuedRef.current = false;
  };

  // 👉 Auto-queue dès l’arrivée sur la page (et leave au unmount)
  useEffect(() => {
    joinQueue();
    return () => leaveQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ------- timing & progression
  const countdown = useMemo(() => {
    if (!startAt) return null;
    return Math.ceil(Math.max(0, startAt - now) / 1000);
  }, [startAt, now]);

  useEffect(() => {
    if (status === 'ready' && startAt && now >= startAt) setStatus('playing');
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

      {/* ✅ Plus d'écran "idle" : on arrive directement ici */}
      {status === 'queue' && (
        <div className="card" style={{ marginTop: 12, textAlign: "center" }}>
          <p>Salle d’attente… on te cherche un adversaire (±100 Elo).</p>
          <div className="row" style={{ gap: 8 }}>
            <button className="btn secondary" onClick={leaveQueue}>Annuler</button>
          </div>
        </div>
      )}

      {status === 'ready' && (
        <div className="card" style={{textAlign: "center"}}>
          <p>
            Match trouvé ! Départ dans <strong>{countdown}</strong>…<br/>
            {players.length === 2 && (
              <span className="muted">
                {players[0].username} ({players[0].rating}) vs {players[1].username} ({players[1].rating}) — durée: <strong>{limitSec}s</strong>
              </span>
            )}
          </p>
        </div>
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
          <div style={{ marginTop: 12 }}>
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
          <span className="trophy">🏆</span>
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

    <div className="actions">
      <button
        className="btn"
        onClick={() => { setResult(null); setOpponent({}); setStatus('idle'); queuedRef.current = false; }}
      >
        Rejouer
      </button>
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
