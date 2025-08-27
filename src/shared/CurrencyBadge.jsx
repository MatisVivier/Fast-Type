import React from 'react';

export default function CurrencyBadge({ coins = 0, onClick }) {
  return (
    <div
      className="currency-badge"
      title="Monnaie"
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '4px 8px', borderRadius: 999, background: '#19202b',
        border: '1px solid #253045', fontWeight: 600
      }}
    >
      <span style={{ fontSize: 14 }}>🪙</span>
      <span>{coins}</span>
    </div>
  );
}
