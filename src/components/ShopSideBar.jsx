import React from 'react';
import '../shop.css';

export default function ShopSidebar({ onClose }) {
  return (
    <div className="shop-sidebar">
      <div className="shop-header">
        <h2>🛒 Boutique</h2>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>

      <div className="shop-content">
        <p>💎 Ici tu pourras acheter des items avec tes pièces.</p>
        <ul>
          <li>⚡ Boost vitesse (10 pièces)</li>
          <li>🔭 Vision augmentée (15 pièces)</li>
          <li>❤️ Soin (20 pièces)</li>
        </ul>
      </div>
    </div>
  );
}
