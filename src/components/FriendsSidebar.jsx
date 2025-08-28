import React, { useEffect, useState } from 'react';
import '../friends.css';
import { apiGet, apiPost, apiDelete } from '../lib/api.js';

export default function FriendsSidebar() {
  const [me, setMe] = useState(null);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [pending, setPending] = useState([]);
  const [friends, setFriends] = useState([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const meJson = await apiGet('/auth/me'); // <-- ABSOLU via api.js
        setMe(meJson?.user || null);
      } catch (e) {
        console.warn('me error', e);
      }
      await refreshAll();
    })();
  }, []);

  async function refreshAll() {
    try {
      const [reqJson, frJson] = await Promise.all([
        apiGet('/friends/requests'),
        apiGet('/friends'),
      ]);
      setPending(reqJson.items || []);
      setFriends(frJson.items || []);
    } catch (e) {
      console.error('refresh error', e);
    }
  }

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
        const json = await apiGet(`/friends/search?q=${encodeURIComponent(search)}`);
        setResults(json.items || []);
      } catch (e) {
        // si CORS/401 → affiche une info plutôt que de crasher
        console.error('search error', e);
        setResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 200);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [search]);

  async function addSelected() {
    if (!selected?.id) return;
    setBusy(true);
    try {
      await apiPost('/friends/requests', { to_user_id: selected.id });
      setSelected(null);
      setSearch('');
      setResults([]);
      await refreshAll();
    } catch (e) {
      console.error('add friend error', e);
      alert(`Impossible d'envoyer la demande: ${e?.error || e?.status || 'erreur réseau'}`);
    } finally { setBusy(false); }
  }

  async function acceptReq(id) { setBusy(true); try { await apiPost(`/friends/requests/${id}/accept`); await refreshAll(); } finally { setBusy(false); } }
  async function declineReq(id) { setBusy(true); try { await apiPost(`/friends/requests/${id}/decline`); await refreshAll(); } finally { setBusy(false); } }
  async function cancelReq(id)  { setBusy(true); try { await apiPost(`/friends/requests/${id}/cancel`);  await refreshAll(); } finally { setBusy(false); } }
  async function removeFriend(id){ if(!confirm('Supprimer cet ami ?')) return; setBusy(true); try { await apiDelete(`/friends/${id}`); await refreshAll(); } finally { setBusy(false); } }

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
