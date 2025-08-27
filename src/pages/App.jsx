import React, { useEffect, useState } from 'react';
import TypeBox from '../shared/MTTypeBox.jsx';
import Auth from './Auth.jsx';
import Duel from './Duel.jsx';
import { apiGet, apiPost } from '../lib/api.js';
import RanksModal from '../components/RanksModal.jsx';
import { getRank } from '../lib/ranks.js';
import SideNav from '../components/SideNav.jsx';       // ⟵ sidebar gauche (actions)
import RightBar from '../components/RightBar.jsx';     // ⟵ sidebar droite (modes)
import { levelFromXp } from '../lib/levels.js';
import AccountPanel from '../components/AccountPanel.jsx';
import '../account.css'

const API = 'https://fast-type-back.onrender.com/api';

function wordCountFor(limitSec) {
  return Math.max(80, Math.round(limitSec * 6.5));
}

export default function App() {
  const [textObj, setTextObj] = useState(null);
  const [ranksOpen, setRanksOpen] = useState(false);
  const [limitSec, setLimitSec] = useState(30);
  const [seed, setSeed] = useState(0);

  const [page, setPage] = useState('home');     // 'home' | 'auth' | 'duel'
  const [user, setUser] = useState(null);

  const fetchRandom = async (lim = limitSec) => {
    const count = wordCountFor(lim);
    const r = await fetch(`${API}/texts/random-words?count=${count}`, { credentials: 'include' });
    const data = await r.json();
    setTextObj(data);
  };

  useEffect(() => {
    fetchRandom(limitSec);
    apiGet('/auth/me').then(res => setUser(res.user));
  }, [limitSec]);

  const refreshUser = async () => {
    const res = await apiGet('/auth/me');
    setUser(res.user);
  };

  const logout = async () => {
    await apiPost('/auth/logout', {});
    setUser(null);
  };

  const goDuel = () => {
    if (!user) { setPage('auth'); return; }
    setPage('duel');
  };

  // Sélection d’un mode depuis la sidebar droite (à étendre plus tard)
  const selectMode = (modeId) => {
    if (modeId === 'solo_time') setPage('home');
    if (modeId === 'daily') alert('Le Défi du jour arrive bientôt ✨');
    if (modeId === 'friendly') alert('Le 1v1 amical arrive bientôt ✨');
  };

  if (page === 'auth') return <Auth onAuthenticated={(u)=>{ setUser(u); setPage('home'); }} />;
  if (page === 'duel') return <Duel onExit={() => setPage('home')} onUserRefresh={refreshUser} />;

  const lvl = levelFromXp(user?.xp || 0);

  return (
    <div className="container">
      <div className="navbar" style={{ display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <h1>Duel Keys</h1>
        <div className="row">
          {user ? (
            <>
              <span className="stat">👤 {user.username || user.email}</span>
              <span className="stat">Lvl {lvl.level} • {lvl.inLevel}/{lvl.need} XP</span>
              <span className="stat">
                Elo: <strong>{user.rating}</strong>
                {' '}•{' '}
                <span className="rank-link" onClick={()=>setRanksOpen(true)}>
                  {getRank(user.rating).label}
                </span>
              </span>
              <button className="btn secondary" onClick={logout}>Se déconnecter</button>
            </>
          ) : (
            <button className="btn" onClick={()=>setPage('auth')}>Se connecter / S’inscrire</button>
          )}
        </div>
      </div>

      {/* === Nouveau layout : sidebar gauche | zone de jeu | sidebar droite === */}
      <div className="layout layout-3">
        <SideNav
          limitSec={limitSec}
          setLimitSec={(d) => setLimitSec(d)}
          onNewText={() => fetchRandom(limitSec)}
          onReset={() => setSeed(s => s + 1)}
        />

        <main className="main">
          <div className="card" style={{ marginTop: 0 }}>
            {textObj ? (
              <TypeBox
                key={`${textObj.id}-${seed}-time-${limitSec}`}
                content={textObj.content}
                mode="time"
                limitSec={limitSec}
                onFinish={async (stats) => {
                  if (user) {
                    await apiPost('/solo/finish', stats);
                    await refreshUser();
                  }
                  console.log('Résultat solo', stats);
                }}
              />
            ) : (
              <p>Chargement du texte…</p>
            )}
          </div>
        </main>

        <RightBar
          user={user}
          onOpenRanks={() => setRanksOpen(true)}
          onGoRanked={goDuel}
          onSelectMode={selectMode}
        />
      </div>

      <RanksModal open={ranksOpen} onClose={()=>setRanksOpen(false)} rating={user?.rating ?? 0} />

        {user && (
  <AccountPanel user={user} onUserUpdate={refreshUser} />
)}
    </div>
  );
}
