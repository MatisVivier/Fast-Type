// FriendsSidebar.jsx
import React, { useState, useEffect } from 'react';
import '../friends.css';

export default function FriendsSidebar() {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [pending, setPending] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addName, setAddName] = useState('');

  // Charger les demandes et les amis
  async function refreshAll() {
    try {
      const reqRes = await fetch('/api/friends/requests', { credentials: 'include' });
      const reqJson = await reqRes.json();
      setPending(reqJson.items || []);

      const fRes = await fetch('/api/friends', { credentials: 'include' });
      const fJson = await fRes.json();
      setFriends(fJson.items || []);
    } catch (e) {
      console.error('refresh error', e);
    }
  }

  useEffect(() => { refreshAll(); }, []);

  // Autocomplete recherche
  useEffect(() => {
    if (!search.trim()) return setResults([]);
    const ctrl = new AbortController();
    const run = async () => {
      setLoading(true);
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
        setLoading(false);
      }
    };
    run();
    return () => ctrl.abort();
  }, [search]);

  // Actions
  async function handleAddFriend() {
    if (!addName.trim()) return;
    try {
      // Ici tu peux adapter pour que "Pseudo#1234" -> id utilisateur via ton API
      alert("À adapter: recherche par pseudo exact côté back");
    } catch (e) {
      console.error('add error', e);
    }
  }

  async function acceptReq(id) {
    await fetch(`/api/friends/requests/${id}/accept`, { method: 'POST', credentials: 'include' });
    refreshAll();
  }
  async function declineReq(id) {
    await fetch(`/api/friends/requests/${id}/decline`, { method: 'POST', credentials: 'include' });
    refreshAll();
  }
  async function removeFriend(id) {
    await fetch(`/api/friends/${id}`, { method: 'DELETE', credentials: 'include' });
    refreshAll();
  }

  return (
    <aside className="friendsbar">
      <div className="friends-header">
        <h2>👥 Amis</h2>
      </div>

      {/* Ajouter un ami */}
      <div className="friends-section">
        <label className="side-label">Ajouter un ami</label>
        <div className="add-row">
          <input
            className="input mono"
            placeholder="Pseudo#1234"
            value={addName}
            onChange={e => setAddName(e.target.value)}
          />
          <button className="btn" onClick={handleAddFriend}>Ajouter</button>
        </div>
        <p className="muted" style={{marginTop:6, fontSize:12}}>
          Envoie une invitation avec le pseudo exact.
        </p>
      </div>

      {/* Recherche */}
      <div className="friends-section">
        <label className="side-label">Rechercher</label>
        <input
          className="input mono"
          placeholder="Rechercher un ami..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {loading && <p className="muted">Recherche...</p>}
        {results.length > 0 && (
          <ul className="friends-list">
            {results.map(u => (
              <li key={u.id} className="friend-item">
                <div className="f-left">
                  <span className="dot" />
                  <div className="f-texts">
                    <div className="f-name">{u.username}</div>
                    <div className="f-sub muted">XP {u.xp}</div>
                  </div>
                </div>
                <div className="f-actions">
                  <button className="btn" onClick={() => alert('ouvrir modale profil ' + u.username)}>Profil</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Demandes en attente */}
      <div className="friends-section">
        <label className="side-label">Demandes en attente</label>
        <div className="req-list">
          {pending.length === 0 && <p className="muted">Aucune demande</p>}
          {pending.map(r => (
            <div key={r.id} className="req-item">
              <div className="req-user">{r.from_username || r.to_username}</div>
              <div className="req-actions">
                {r.to_user_id && (
                  <>
                    <button className="btn" onClick={() => acceptReq(r.id)}>Accepter</button>
                    <button className="btn secondary" onClick={() => declineReq(r.id)}>Refuser</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Amis */}
      <div className="friends-section">
        <label className="side-label">Mes amis</label>
        <ul className="friends-list">
          {friends.map(f => (
            <li key={f.id} className="friend-item">
              <div className="f-left">
                <span className="dot online" />
                <div className="f-texts">
                  <div className="f-name">{f.username}</div>
                  <div className="f-sub muted">XP {f.xp}</div>
                </div>
              </div>
              <div className="f-actions">
                <button className="btn" onClick={() => alert('profil ' + f.username)}>Profil</button>
                <button className="btn secondary" onClick={() => removeFriend(f.id)}>Supprimer</button>
              </div>
            </li>
          ))}
          {friends.length === 0 && <p className="muted">Aucun ami</p>}
        </ul>
      </div>
    </aside>
  );
}
