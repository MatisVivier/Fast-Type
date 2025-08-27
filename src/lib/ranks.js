// Tu peux éditer / ajouter des lignes ici facilement.
// Les intervalles sont [min, max) (min inclus, max exclu), sauf Infinity.
export const RANKS = [
  { min: 0,   max: 50,  tier: 'Bronze',  level: 1 },
  { min: 50,  max: 125, tier: 'Bronze',  level: 2 },
  { min: 125, max: 200, tier: 'Bronze',  level: 3 },
  { min: 200, max: 250, tier: 'Argent',  level: 1 },
  { min: 250, max: 325, tier: 'Argent',  level: 2 },
  { min: 325, max: 400, tier: 'Argent',  level: 3 },
  { min: 400, max: 450, tier: 'Or',      level: 1 },
  { min: 450, max: 525, tier: 'Or',      level: 2 },
  { min: 525, max: 600, tier: 'Or',      level: 3 },
  { min: 600, max: 675, tier: 'Diamant', level: 1 },
  { min: 675, max: 800, tier: 'Diamant', level: 2 },
  { min: 800, max: 900, tier: 'Diamant', level: 3 },
  { min: 900, max: Infinity, tier: 'Maître', level: 1 }, // placeholder
];

export function getRank(rating = 0) {
  const r = Math.max(0, Math.floor(rating));
  const idx = RANKS.findIndex(x =>
    (r >= x.min && r < x.max) || (!isFinite(x.max) && r >= x.min)
  );
  const found = idx >= 0 ? RANKS[idx] : RANKS[0];
  const label = `${found.tier} ${found.level}`;
  const span = isFinite(found.max) ? (found.max - found.min) : null;
  const progress = span ? Math.max(0, Math.min(1, (r - found.min) / span)) : 1;
  return { ...found, label, progress, rating: r, idx };
}

// Rang suivant (ou null si dernier)
export function getNextRank(idx) {
  const next = RANKS[idx + 1];
  if (!next) return null;
  return { ...next, label: `${next.tier} ${next.level}` };
}

export function formatRange({ min, max }) {
  return isFinite(max) ? `${min} – ${max}` : `${min}+`;
}