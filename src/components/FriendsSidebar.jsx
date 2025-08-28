// FriendsSidebar.jsx
import React, { useEffect, useState } from 'react';
import '../friends.css';

export default function FriendsSidebar() {
  const [me, setMe] = useState(null);

  // --- Ajouter par recherche ---
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selected, setSelected] = useState(null); // user sélectionné sous la barre

  // --- Demandes & amis ---
  const [pending, setPending] = useState([]);
  const [friends, setFriends] = useState([]);
  const [busy, setBusy] = useState(false);

  // --- Boot: who am I + initial data ---
  useEffect(() => {
    (async () => {
      try {
        // Ton back a déjà un /api/auth/me
        const meRes = await fetch('/api/auth/me', { credentials: 'include' });
        const meJson = await meRes.json();
        setMe(meJson?.user || null);
      } catch (e) {
        console.error('me error', e);
      }
      await refreshAll();
    })();
  }, []);

  async function refreshAll() {
    try {
      const [reqRes, frRes] = await Promise.all([
        fetch('/api/friends/requests', { credentials: 'include' }),
        fetch('/api/friends',         { credentials: 'include' }),
      ]);
      const reqJson = await reqRes.json();
      const frJson  = await frRes.json();
      setPending(reqJson.items || []);
      setFriends(frJson.items || []);
    } catch (e) {
      console.error('refresh error', e);
    }
  }

  // --- Autocomplete (debounce) ---
  useEffect(() => {
    if (!search.trim()) {
      setResults([]);
      setSelected(null);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(`/api/friends/search?q=${encodeURIComponent(search)}`, {
          credentials: 'include',
          signal: ctrl.signal,
        });
        const json = await res.json();
        setResults(json.items || []);
      } catch (e) {
        if (e.name !== 'AbortError') console.error('search error', e);
      } finally {
        setSearchLoading(false);
      }
    }, 200); // petit debounce
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [search]);

  // --- Ajouter un ami depuis "selected" ---
  async function addSelected() {
    if (!selected?.id) return;
    setBusy(true);
    try {
      const res = await fetch('/api/friends/requests', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to_user_id: selected.id }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const code = err?.error || res.status;
        alert(`Impossible d'envoyer l'invitation (${code})`);
        return;
      }
      // reset sélection + refresh demandes
      setSelected(null);
      setSearch('');
      setResults([]);
      await refreshAll();
    } catch (e) {
      console.error('add friend error', e);
      alert('Erreur réseau lors de l’envoi de la demande');
    } finally {
      setBusy(false);
    }
  }

  // --- Demandes: accept/refuse/cancel ---
  async function acceptReq(id) {
    setBusy(true);
    try {
      await fetch(`/api/friends/requests/${id}/accept`, { method: 'POST', credentials: 'include' });
      await refreshAll();
    } finally { setBusy(false); }
  }
  async function declineReq(id) {
    setBusy(true);
    try {
      await fetch(`/api/friends/requests/${id}/decline`, { method: 'POST', credentials: 'include' });
      await refreshAll();
    } finally { setBusy(false); }
  }
  async function cancelReq(id) {
    setBusy(true);
    try {
      await fetch(`/api/friends/requests/${id}/cancel`,  { method: 'POST', credentials: 'include' });
      await refreshAll();
    } finally { setBusy(false); }
  }

  // --- Amis: supprimer ---
  async function removeFriend(id) {
    if (!confirm('Supprimer cet ami ?')) return;
    setBusy(true);
    try {
      await fetch(`/api/friends/${id}`, { method: 'DELETE', credentials: 'include' });
      await refreshAll();
    } finally { setBusy(false); }
  }

  // --- Affichage demande: entrante vs sortante ---
  const isIncoming = (r) => me && r.to_user_id === me.id;     // on m’a invité

  return (
    <aside className="friendsbar">
      <div className="friends-header">
        <h2>👥 Amis</h2>
      </div>

      {/* Recherche + sélection */}
      <div className="friends-section">
        <label className="side-label">Rechercher</label>
        <input
          className="input mono"
          placeholder="Rechercher un joueur…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {searchLoading && <p className="muted" style={{marginTop:6, fontSize:12}}>Recherche…</p>}

        {/* Résultats d’auto-complétion */}
        {results.length > 0 && (
          <ul className="friends-list" style={{ marginTop: 8 }}>
            {results.map(u => (
              <li key={u.id} className="friend-item" onClick={() => setSelected(u)} style={{ cursor: 'pointer' }}>
                <div className="f-left">
                  <span className="dot" />
                  <div className="f-texts">
                    <div className="f-name">{u.username}</div>
                    <div className="f-sub muted">XP {u.xp ?? 0}</div>
                  </div>
                </div>
                <div className="f-actions">
                  <button className="btn" onClick={(e) => { e.stopPropagation(); setSelected(u); }}>
                    Sélectionner
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Carte utilisateur sélectionné sous la barre */}
        {selected && (
          <div className="req-item" style={{ marginTop: 8 }}>
            <div className="req-user">{selected.username}</div>
            <div className="req-actions">
              <button className="btn" disabled={busy} onClick={addSelected}>Ajouter</button>
              <button className="btn secondary" disabled={busy} onClick={() => setSelected(null)}>Annuler</button>
            </div>
          </div>
        )}
      </div>

      {/* Demandes en attente */}
      <div className="friends-section">
        <label className="side-label">Demandes en attente</label>
        <div className="req-list">
          {pending.length === 0 && <p className="muted">Aucune demande</p>}
          {pending.map(r => (
            <div key={r.id} className="req-item">
              <div className="req-user">
                {isIncoming(r) ? (r.from_username ?? '…') : (r.to_username ?? '…')}
                <span className="muted" style={{ marginLeft: 6, fontSize: 12 }}>
                  {isIncoming(r) ? 't’a invité' : 'invité'}
                </span>
              </div>
              <div className="req-actions">
                {isIncoming(r) ? (
                  <>
                    <button className="btn" disabled={busy} onClick={() => acceptReq(r.id)}>Accepter</button>
                    <button className="btn secondary" disabled={busy} onClick={() => declineReq(r.id)}>Refuser</button>
                  </>
                ) : (
                  <button className="btn secondary" disabled={busy} onClick={() => cancelReq(r.id)}>Annuler</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mes amis */}
      <div className="friends-section">
        <label className="side-label">Mes amis</label>
        <ul className="friends-list">
          {friends.map(f => (
            <li key={f.id} className="friend-item">
              <div className="f-left">
                <span className="dot online" />
                <div className="f-texts">
                  <div className="f-name">{f.username}</div>
                  <div className="f-sub muted">XP {f.xp ?? 0}</div>
                </div>
              </div>
              <div className="f-actions">
                {/* Remplace par ta vraie modale profil => GET /api/users/:id/profile */}
                <button className="btn" onClick={() => alert('Profil de ' + f.username)}>Profil</button>
                <button className="btn secondary" disabled={busy} onClick={() => removeFriend(f.id)}>Supprimer</button>
              </div>
            </li>
          ))}
          {friends.length === 0 && <p className="muted">Aucun ami</p>}
        </ul>
      </div>
    </aside>
  );
}
