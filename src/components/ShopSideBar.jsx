import React from 'react';
import '../shop.css';

export default function ShopSidebar() {
  return (
    <aside className="shop-sidebar">
      <div className="shop-header">
        <h2>🛒 Boutique</h2>
      </div>

      <div className="shop-content">
        <p>💎 Achète des items avec tes pièces.</p>

        <ul className="shop-list">
          <li className="shop-item">
            <div className="item-left">
              <span className="item-emoji">⚡</span>
              <div className="item-infos">
                <div className="item-title">Boost vitesse</div>
                <div className="item-desc">+vitesse pendant un run</div>
              </div>
            </div>
            <div className="item-price">10 <span className="coin">pièces</span></div>
          </li>

          <li className="shop-item">
            <div className="item-left">
              <span className="item-emoji">🔭</span>
              <div className="item-infos">
                <div className="item-title">Vision augmentée</div>
                <div className="item-desc">zone de visibilité +large</div>
              </div>
            </div>
            <div className="item-price">15 <span className="coin">pièces</span></div>
          </li>

          <li className="shop-item">
            <div className="item-left">
              <span className="item-emoji">❤️</span>
              <div className="item-infos">
                <div className="item-title">Soin</div>
                <div className="item-desc">récupère une vie</div>
              </div>
            </div>
            <div className="item-price">20 <span className="coin">pièces</span></div>
          </li>
        </ul>
      </div>
    </aside>
  );
}
