import React from 'react';

export default function RightBar({ onGoRanked, onSelectMode }) {
  const modes = [
    {
      id: 'ranked',
      title: '1v1 Classé (20s)',
      desc: "Affronte un joueur de ton Elo",
      primary: true,
      onClick: onGoRanked,
    },
    {
      id: 'daily',
      title: 'Défi du jour',
      desc: "Même texte pour tous, 1 run/jour.",
      disabled: true,
      onClick: () => onSelectMode?.('daily'),
    },
    {
      id: 'friendly',
      title: '1v1 Amical',
      desc: "Sans Elo, via invitation.",
      disabled: true,
      onClick: () => onSelectMode?.('friendly'),
    },
  ];

  return (
    <aside className="sidebar rightbar card">

      <div className="modes-col">
        {modes.map(m => (
          <button
            key={m.id}
            className={`mode-card ${m.primary ? 'primary' : ''}`}
            disabled={m.disabled}
            onClick={m.onClick}
            type="button"
            title={m.disabled ? 'Bientôt' : m.title}
          >
            <div className="mode-title">{m.title}</div>
            <div className="mode-desc">{m.desc}</div>
            {m.disabled && <span className="mode-badge">Bientôt</span>}
          </button>
        ))}
      </div>
    </aside>
  );
}
