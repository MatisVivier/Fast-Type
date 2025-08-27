import React, { useEffect, useState } from 'react';
import { apiGet, apiPost } from '../lib/api.js';
import '../auth.css'

export default function Auth({ onAuthenticated }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => { setError(null); }, [mode]);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    const path = mode === 'login' ? '/auth/login' : '/auth/register';
    const body = mode === 'login' ? { email, password } : { email, password, username };
    const res = await apiPost(path, body);
    if (res.error) { setError(res.error); return; }
    const me = await apiGet('/auth/me');
    onAuthenticated?.(me.user);
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card card">
        <h2 className="auth-title">{mode === 'login' ? 'Se connecter' : 'Créer un compte'}</h2>

        <div className="auth-tabs">
          <button
            type="button"
            className={`btn tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => setMode('login')}
          >
            Connexion
          </button>
          <button
            type="button"
            className={`btn tab ${mode === 'register' ? 'active' : ''}`}
            onClick={() => setMode('register')}
          >
            Inscription
          </button>
        </div>

        <form onSubmit={submit} className="auth-form">
          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                className="input mono"
                value={username}
                onChange={e=>setUsername(e.target.value)}
                placeholder="ex: speedyfox"
                required
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className="input mono"
              type="email"
              value={email}
              onChange={e=>setEmail(e.target.value)}
              placeholder="toi@exemple.com"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Mot de passe</label>
            <input
              className="input mono"
              type="password"
              value={password}
              onChange={e=>setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {error && <div className="error-callout">Erreur : {error}</div>}

          <button className="btn btn-block" type="submit">
            {mode==='login' ? 'Connexion' : 'Créer mon compte'}
          </button>
        </form>
      </div>
    </div>
  );
}
