import React, { useEffect, useMemo, useRef } from 'react';
import { RANKS, getRank, getNextRank, formatRange } from '../lib/ranks.js';

export default function RanksModal({ open, onClose, rating }) {
  const mine = useMemo(() => getRank(rating), [rating]);

  // tri décroissant pour affichage
  const ranksSorted = useMemo(() => [...RANKS].sort((a, b) => b.min - a.min), []);
  const listRef = useRef(null);
  const myRowRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const list = listRef.current, row = myRowRef.current;
    if (list && row) {
      const top = row.offsetTop - list.clientHeight / 2 + row.clientHeight / 2;
      list.scrollTo({ top, behavior: 'auto' });
    }
  }, [open, rating]);

  if (!open) return null;

  const next = getNextRank(mine.idx); // <-- vrai rang suivant

  return (
    <div style={backdropStyle} onClick={onClose}>
      <div style={modalStyle} className="card" onClick={e => e.stopPropagation()}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <h3 style={{margin:0}}>Tableau des rangs</h3>
          <button className="btn" onClick={onClose}>Fermer</button>
        </div>

        <div style={{marginTop:12, marginBottom:8}}>
          <div><strong>Ton Elo :</strong> {rating}</div>
          <div><strong>Ton rang :</strong> {mine.label} <span style={{color:'#9aa4af'}}>({formatRange(mine)})</span></div>
        </div>

        <div ref={listRef} style={{maxHeight: '50vh', overflow:'auto', border:'1px solid #1e222a', borderRadius:10}}>
          <table style={{width:'100%', borderCollapse:'collapse', fontSize:14}}>
            <thead>
              <tr style={trHead}>
                <th style={thTd}>Tier</th>
                <th style={thTd}>Niveau</th>
                <th style={thTd}>Plage Elo</th>
              </tr>
            </thead>
            <tbody>
              {ranksSorted.map((r, i) => {
                const isMe = (rating >= r.min && rating < r.max) || (!isFinite(r.max) && rating >= r.min);
                return (
                  <tr key={`${r.tier}-${r.level}-${i}`} ref={isMe ? myRowRef : null} style={isMe ? trMe : trRow}>
                    <td style={thTd}>{r.tier}</td>
                    <td style={thTd}>{r.level}</td>
                    <td style={thTd}>{formatRange(r)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {next && isFinite(mine.max) ? (
          <div style={{marginTop:12}}>
            <div style={{fontSize:12, color:'#9aa4af', marginBottom:6}}>
              Progression vers <strong>{next.label}</strong> :
            </div>
            <div style={{height:8, background:'#0f1116', border:'1px solid #1e222a', borderRadius:6, overflow:'hidden'}}>
              <div style={{height:'100%', width:`${(mine.progress*100).toFixed(0)}%`, background:'#e2b714'}} />
            </div>
          </div>
        ) : (
          <div style={{marginTop:12, fontSize:12, color:'#9aa4af'}}>
            Rang maximum atteint.
          </div>
        )}
      </div>
    </div>
  );
}

const backdropStyle = { position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 };
const modalStyle   = { width:'min(560px, 92vw)', padding:16, background:'#12141a' };
const trHead       = { background:'#0f1116', position:'sticky', top:0 };
const trRow        = { borderTop:'1px solid #1e222a' };
const trMe         = { ...trRow, background:'rgba(226, 183, 20, 0.1)' };
const thTd         = { textAlign:'left', padding:'10px 12px' };
