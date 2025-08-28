import React from 'react';
import '../friends.css';

export default function FriendsSidebar() {
  return (
    <aside className="friendsbar">
      <div className="friends-header">
        <h2>👥 Amis</h2>
      </div>

      <div className="friends-section">
        <label className="side-label">Ajouter un ami</label>
        <div className="add-row">
          <input className="input mono" placeholder="Pseudo#1234" />
          <button className="btn">Ajouter</button>
        </div>
        <p className="muted" style={{marginTop:6, fontSize:12}}>
          Envoie une invitation avec le pseudo exact.
        </p>
      </div>

      <div className="friends-section">
        <label className="side-label">Rechercher</label>
        <input className="input mono" placeholder="Rechercher un ami..." />
      </div>

      <div className="friends-section">
        <label className="side-label">Demandes en attente</label>
        <div className="req-list">
          <div className="req-item">
            <div className="req-user">Nazzuma</div>
            <div className="req-actions">
              <button className="btn">Accepter</button>
              <button className="btn secondary">Refuser</button>
            </div>
          </div>
          {/* d'autres items plus tard via API */}
        </div>
      </div>

      <div className="friends-section">
        <label className="side-label">Mes amis</label>
        <ul className="friends-list">
          <li className="friend-item">
            <div className="f-left">
              <span className="dot online" />
              <div className="f-texts">
                <div className="f-name">Tisma</div>
                <div className="f-sub muted">En ligne • WPM 90</div>
              </div>
            </div>
            <div className="f-actions">
              <button className="btn">Inviter</button>
            </div>
          </li>

          <li className="friend-item">
            <div className="f-left">
              <span className="dot offline" />
              <div className="f-texts">
                <div className="f-name">Nazzuma</div>
                <div className="f-sub muted">Hors ligne</div>
              </div>
            </div>
            <div className="f-actions">
              <button className="btn secondary">•••</button>
            </div>
          </li>
        </ul>
      </div>
    </aside>
  );
}
